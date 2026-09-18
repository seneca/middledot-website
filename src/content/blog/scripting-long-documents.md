---
title: "Scripting Long Documents"
description: "What the 3.3 release unlocks for long documents — and the workarounds long-document scripts still need."
pubDate: 2026-09-20
tags: ["tutorial", "long-documents", "master-pages", "text-styles"]
images:
  - /images/blog/scripting-long-documents/long-documents.png
---

The 3.3 release opens up a lot of possibilities for long-document work. Finding and re-styling paragraph pairs across a whole book — for example, a "Heading 1" followed immediately by "Body Text" — is now feasible from a script, in a single undo step.

There is one big caveat: the 3.3 scripting surface is still in beta; some things aren't scriptable yet. The release notes state that scripting is still in beta and not all has been exposed yet. Working with text frames that originate on master pages is one of the gaps. Two others: a script cannot ask the document which paragraph and character styles it carries, and it cannot create new styles either.

This post walks through the workarounds using [`para-pairs`](/scripts/para-pairs/) (v1.2.5) as the worked example — find a paragraph with style A followed immediately by a paragraph with style B, and re-style the pair.

## Master-page text frames are invisible to the obvious APIs

`doc.layers.all` and `doc.spreads` don't include master spreads. A long document that keeps its running text frames on masters would silently scan nothing if you only walked `doc.layers`.

The workaround is to walk the node tree explicitly: page content first, then every master spread's main descendants:

```javascript
function* iterAllTextLikeNodes(doc) {
  for (const layer of doc.layers.all) {
    if (layer) yield layer;
  }
  // Master spreads aren't included in doc.layers / doc.spreads.
  const rootHandle = doc.rootNode.handle;
  for (const masterSpread of getNodeChildren(
    rootHandle,
    NodeChildType.MasterSpread,
    false,
  )) {
    if (!masterSpread) continue;
    for (const descendant of getNodeChildrenRecursive(
      masterSpread.handle,
      NodeChildType.Main,
      false,
    )) {
      if (descendant) yield descendant;
    }
  }
}
```

Only frame-text nodes are kept downstream (`layer.isFrameTextNode`), so this yields every candidate frame including the master-originated ones.

## No style inventory, no style creation

There is no call that returns "all paragraph styles in this document" or "all character styles", and there is no call to create a new style from a script. So the script builds its own picture: it reads every story's paragraph ranges and records the style name attached at each range start.

```javascript
function getParagraphsOfStory(story, paragraphStyleType) {
  const paras = [];
  for (const range of story.paragraphRanges) {
    let styleName = "";
    try {
      styleName =
        story
          .getParagraphAtts(range.begin)
          .getStringValue(paragraphStyleType.StyleName) || "";
    } catch (e) {
      styleName = "";
    }
    paras.push({ begin: range.begin, end: range.end, style: styleName });
  }
  return paras;
}
```

The scan collects those names into a set, sorted case-insensitively (the runtime's `localeCompare` throws ICU errors, so the comparator lowercases manually). An empty string means `[No Paragraph Style]`, and it is listed last. The dialog is honest about the limitation:

> Lists show paragraph styles currently used in the document.

Applying a style is possible — creating one is not. The script applies replacements with a paragraph-string delta:

```javascript
const delta = StoryDelta.createParagraphString(
  paragraphStyleType.StyleName,
  styleName,
);
return DocumentCommand.createFormatText(sel, delta);
```

That is why the dialog offers "Any paragraph style" for matching and "Keep current style" for replacement: since only styles already in use can be listed and only existing styles can be applied, the flexible sentinels keep the tool useful within those bounds.

## Stories have no identity primitive

Fresh JS wrappers defeat `===`, and `isSameNode` exists on nodes but never on stories. Comparing two `story` objects directly tells you nothing.

The workaround is to compare flows, not stories. Frames that share a text flow share a story, and frames are nodes, so node identity works:

```javascript
function getFlowFrames(node) {
  try {
    const frameInterface = node.textFrameInterface;
    if (frameInterface) {
      const flow = frameInterface.textFlowNodes;
      if (flow && flow.length > 0) return flow;
    }
  } catch (e) {}
  return null;
}

function isSameFlow(nodeA, flowA, nodeB, flowB) {
  if (isSameSdkNode(nodeA, nodeB)) return true;
  if (flowA) {
    for (const frame of flowA) {
      try {
        if (isSameSdkNode(frame, nodeB)) return true;
      } catch (e) {}
    }
  }
  if (flowB) {
    for (const frame of flowB) {
      try {
        if (isSameSdkNode(frame, nodeA)) return true;
      } catch (e) {}
    }
  }
  return false;
}
```

Scanning groups frames by shared flow, so each story is processed once even when it spans many linked frames — including frames that came from a master page.

## Two more workarounds worth knowing

Reading the live text selection can disturb it, so the script snapshots scope with a temporary glyph-style marker (and a U+E000 caret probe), then undoes the probe — guarded by the history position so a silently failed probe can never pop one of the user's own history entries. And `formatText` requires the target spread to be current (otherwise `COMMAND_FAILED`), so hits are grouped per spread and executed through a `CompoundCommandBuilder`: one undo step for the whole run, ending back on the spread where the user started.

## What this means for long-document authors

Long-document scripting in 3.3 is genuinely useful, but you should expect scaffolding: walk the node tree for masters, derive the style list from stories in use, group by text flow, and apply — never create — styles. Once those workarounds are in place, a script like [`para-pairs`](/scripts/para-pairs/) can process a whole book, master pages included, in one undoable action.
