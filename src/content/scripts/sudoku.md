---
title: "Sudoku Generator"
description: "Generates valid Sudoku puzzles with unique solutions."
pubDate: 2026-09-15
tags: ["sudoku", "generator"]
images:
  - /images/scripts/sudoku/sudoku-dialog.png
  - /images/scripts/sudoku/sudoku.png
downloads:
  - /downloads/scripts/sudoku-generator.zip
---

Generates valid Sudoku puzzles with unique solutions.

## Installation

1. Download the zip file and unzip it.

2. Run the script in one of two ways:

**a) Run directly** — Open the Script Editor panel
(**Window > Scripting > Script Editor**), paste the contents
of `sudoku-generator.js` into the editor, and press **Run**.

**b) Save to Script Library first** — Follow step (a) above,
then click **Save As...** to save the script to the Script
Library. Open the Script Library panel (**Window > Scripting >
Script Library**) and click the saved script once to run it.

## Purpose

Generates a Sudoku puzzle and draws it onto the current document.
If no document is open, a new A4 portrait document at 300 dpi is
created automatically.

## How it works

The script uses a standard backtracking algorithm to generate a valid
complete grid, then digs out cells one at a time while verifying that
the puzzle still has exactly one solution. This guarantees every
generated puzzle is solvable and has a unique answer — not just random
numbers.

## Features

- **4 difficulty levels** — Easy (36 empty), Medium (46 empty), Hard (52 empty), Expert (58 empty)
- **Adjustable grid size** — 40–500 mm, auto-clamped to fit the page
- **Optional title** — Displays `Sudoku · <difficulty>` above the grid when enabled
- **Auto-document** — Creates an A4 300 dpi document if none is open
- **Single undo** — All shapes and text are placed in one undo step
- **Scaled strokes** — Line weight scales with grid size so borders stay proportional

## Usage tips

- Clue numbers are individually editable art-text nodes — double-click
  any number to change it after placement.
- Grid size should match your page layout; larger grids need more page
  space, especially with the title enabled.
- The script groups everything under a node named **"Sudoku"** for easy
  selection and positioning.

## Known limitations

Each cell, clue, and the title becomes an individually editable
Affinity object after placement. Moving or resizing cells individually
can break the grid alignment — use the group node to reposition the
entire puzzle at once.

## Changelog

1.0.1 - Stroke weight now scales with grid size

1.0.0 - Initial version