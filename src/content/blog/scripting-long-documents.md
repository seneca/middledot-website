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

Here is a trap that is easy to fall into. You grab a story from a frame, grab it again, and compare:

```javascript
const s1 = node.storyInterface.story;
const s2 = node.storyInterface.story;
s1 === s2; // false — even though it's the same story
```

Why `false`? Every time your script touches an SDK object, the Affinity JS bridge builds a fresh JavaScript wrapper around the same underlying native object. `===` compares the wrappers, not what's inside them — so two wrappers around the identical native story are never equal.

The SDK does offer `isSameNode()`, which compares the native side properly — but it exists on nodes only, never on stories. And there is no story ID, handle, or name you could compare instead. So there is simply no direct way to ask "are these two stories the same story?".

The workaround is to stop comparing stories and compare frames instead. Frames are nodes, so `isSameNode` works on them. Frames that share a text flow share a story — so if frame A appears in frame B's `textFrameInterface.textFlowNodes` list (or vice versa), both frames belong to the same story:

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

### Reading the selection without destroying it

Simply asking the SDK for the live text selection can disturb that very selection — especially in master-derived frames, where `doc.selection` may read empty even though the user clearly has text selected. So the script never trusts a direct read. Instead it takes a snapshot in two stages.

First, it applies a temporary glyph style — a marker string stamped with a unique name — to whatever the live selection is, via `doc.formatText` with no selection argument (which targets the live UI selection). It then scans every story for that marker to find which flow actually holds the selection. Second, it distinguishes a real range selection from a collapsed caret with a probe: it inserts a single private-use character (U+E000, guaranteed never to collide with real text) and measures the story-length delta. A `+1` proves a caret; anything else proves a range.

Both the marker and the probe mutate the document, so both must be undone immediately. But a blind `doc.undo()` is dangerous: if the probe silently failed and pushed no history entry, the undo would pop one of the user's own history entries instead. So the script records the history position before each probe and only undoes when the position actually advanced:

```javascript
function shouldUndoProbe(historyBefore, mutationFound, doc) {
  if (historyBefore === null) return mutationFound;
  const historyAfter = getHistoryPosition(doc);
  if (historyAfter === null) return mutationFound;
  return historyAfter > historyBefore;
}
```

Undo only with history evidence; trust the scan result when history is unreadable.

### Formatting requires the right spread to be current

`formatText` fails with `COMMAND_FAILED` unless the spread containing the target frame is the current spread. A whole-book run touches many spreads, so the script groups all hits per spread, switches to each spread exactly once (starting spread processed last, so the run ends where the user began), and executes everything through a single `CompoundCommandBuilder`. The result: one undo step for the entire run, and the viewport never moves as a side effect.

## A note on the size of these scripts

This article mentions the `para-pairs` script, and the same applies to `para-joiner`: both are quite long. Much of that length is shared scaffolding — the master-spread walk, the flow grouping, the marker/probe snapshot — and it would be possible to make the scripts shorter by extracting the common parts into a library and importing it where needed.

I deliberately kept them as they are. The SDK is going to add a lot of this in the future — style inventories, proper story identity, master-aware selection reads — and once more is exposed by the SDK, much of this scaffolding becomes unnecessary. I hope to revisit both scripts then and make them considerably shorter.

## What this means for long-document authors

Long-document scripting in 3.3 is genuinely useful, but you should expect scaffolding: walk the node tree for masters, derive the style list from stories in use, group by text flow, and apply — never create — styles. Once those workarounds are in place, a script like [`para-pairs`](/scripts/para-pairs/) can process a whole book, master pages included, in one undoable action.

## A final caveat

This is largely based on my own discoveries and work with the 3.3 scripting surface, aided by AI, so treat it as a work in progress rather than the final word. If you've found a better approach or spotted an error, I'd be glad to hear from you.
