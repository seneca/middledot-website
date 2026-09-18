---
title: "Para Joiner"
description: "Joins selected paragraphs by replacing breaks with a single space."
pubDate: 2026-09-19
tags: ["paragraphs", "productivity"]
images:
  - /images/scripts/para-joiner/para-joiner-01.png
  - /images/scripts/para-joiner/para-joiner-02.png
downloads:
  - /downloads/scripts/para-joiner.zip
---

Joins selected paragraphs by replacing breaks with a single space.

![Before joining — paragraphs selected across the break](/images/scripts/para-joiner/para-joiner-01.png)

![After joining — one continuous paragraph](/images/scripts/para-joiner/para-joiner-02.png)

## Installation

1. Download the zip file and unzip it.

2. Run the script in one of two ways:

   **a) Run directly** — Open the Script Editor panel
   (**Window > Scripting > Script Editor**), paste the contents
   of `para-joiner.js` into the editor, and press **Run**.

   **b) Save to Script Library first** — Follow step (a) above,
   then click **Save As...** to save the script to the Script
   Library. Open the Script Library panel (**Window > Scripting >
   Script Library**) and click the saved script once to run it.

## Purpose

Joins the selected text range by replacing paragraph breaks,
soft returns (Shift+Enter), and surrounding non-printing whitespace
(regular spaces, tabs, NBSP, thin, hair, ideographic, etc.) with a
single normal ASCII space. Runs of whitespace are collapsed to one
space and punctuation at line ends (commas, full stops, etc.) is
preserved — only spaces/tabs/NBSP-family are ever removed. Character
styles and inline elements (custom fields, etc.) are preserved because
only the affected glyphs themselves are touched. Paragraph style is
left as-is (the merged paragraph natively retains the first paragraph's
style; the pull-back line acquires the previous line's style), making
the script generally applicable. No `<Style> Block` style is applied.

Works on both normal and master-derived text frames. On master-derived
frames, a temporary character style is applied to the live selection to
discover its range, then undone. Supports linked/threaded frames spanning
spreads — a selection that spans linked frames across pages is joined as
one paragraph with a single space (no forced break at the thread/overflow
boundary); separate unlinked text boxes are not merged across stories.

## How it works

The script first captures the live text selection — directly from
`doc.selection` when available, or via a temporary character-style
marker (applied with `doc.formatText`, then undone) when the selection
sits in a master-derived frame where `doc.selection` reads empty. Hits
are grouped by text flow (`textFrameInterface.textFlowNodes`) so a drag
spanning linked frames across spreads coalesces to a single logical
story range.

It then scans that range for hard paragraph breaks
(`story.isParagraphBreak`) and real soft breaks (`glyph.isSoftBreak`
with `!isCharGlyph`, since plain spaces also report `isSoftBreak`),
expanding each break to swallow adjacent trimmable whitespace. Only
non-printing whitespace is ever included — punctuation is explicitly
guarded — and per-position `story.getText(pos, 1)` reads avoid the
`U+2029` snapshot misalignment where bulk `getText(begin, count)`
omits break characters. Each run is replaced `N→1` with a single space
in one batched `CompoundCommandBuilder`, executed right-to-left, in a
single undo step without moving you to another page.

## Features

- **Break joining** — Hard paragraph breaks and real soft returns
  (Shift+Enter) become a single space
- **Whitespace normalisation** — Tabs, NBSP, thin/hair/ideographic
  spaces and multi-space runs collapse to one ASCII space
- **Punctuation safe** — Commas, full stops, `; : ! ? ' " - ( )`
  at line ends are never stripped
- **Character styles preserved** — Only break/whitespace glyphs are
  touched; character styles and inline objects survive
- **Paragraph style untouched** — Merged paragraph keeps the first
  paragraph's style natively; no `Block` style created
- **Cross-spread threaded support** — Linked frames across pages join
  as one continuous paragraph (`A1 A2 | B1 B2` → `A1 A2 B1 B2`)
- **Master-derived frames** — Style-marker capture with guaranteed undo
- **Single undo** — All replacements revert in one step
- **Silent** — No alerts; exits quietly when there is nothing to join
- **Stays on your page** — The viewport never moves as a result of the run

## Usage tips

- Drag across the paragraphs to join (a bare caret is not enough —
  make an actual text range selection).
- Clicking a text frame without selecting text does nothing; drag
  across the text you want merged.
- For threaded stories, drag from the first frame into the linked
  frame across the spread — the whole span joins as one paragraph
  with single spaces, including the break at the thread boundary.
- A single plain space is left alone; only runs that would change
  (multi-space, tab, or NBSP-family) are normalised.
- Everything reverts in one undo step if the result surprises you.

## Known limitations

- A text range selection is required — a bare cursor (insertion point)
  is not supported (exits silently, no alert).
- Paragraph style is left as-is; the merged paragraph retains the first
  paragraph's style natively.  No `Block` style is created or applied.
- Only linked/threaded frames are supported for cross-spread selections;
  separate unthreaded text boxes cannot be selected together in Publisher
  and that case is not handled.
- No alerts are shown — if no break/space to normalize, the script exits
  silently (more generally applicable).
- Zero-width spaces (U+200B, U+200D, U+FEFF, etc.) are not normalised
  to a visible space because doing so would insert a character where
  none existed.  If you need them removed, that can be added separately.
- On master-derived frames, a bare cursor cannot be detected; make an
  actual text selection.

## Changelog

1.3.12 - Match linked frames by text-flow membership (textFrameInterface.textFlowNodes); Story objects expose no identity primitive, so story-identity grouping could never match across wrappers

1.3.11 - Size reduction; faster on large threaded selections

1.3.10 - Fix maxEnd truncation for distinct wrappers

1.3.9 - Fix second linked frame not joined

1.3.8 - Threaded-only, no alerts; coalesce distinct JS wrappers

1.3.7 - Cross-spread linked/threaded support

1.3.6 - Remove `<Style> Block` application

1.3.5 - Fix isSoftBreak mis-detection

1.3.4 - Robust whitespace handling for U+2029 omission

1.3.3 - Fix double-space and punctuation regression

1.3.2 - Bug fix: merging preserves commas and punctuation

1.3.1 - Performance: batched text replacements

1.3.0 - Non-standard space normalisation

1.2.0 - Soft returns handled alongside hard breaks

1.1.0 - Character styles and inline objects preserved

1.0.1 - Fix paragraph breaks now joined correctly

1.0.0 - Initial version; works on normal and master-derived frames
