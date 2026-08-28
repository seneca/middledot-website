---
title: "Batch Export Layers"
description: "Export all layers in a document as individual PNG files with a single click."
pubDate: 2026-08-28
affinityVersion: "Designer 2 / Photo 2"
tags: ["export", "productivity", "designer"]
---

A simple script that exports every layer in the active document as a separate PNG file, named after the layer.

## Usage

1. Open your Affinity document
2. Run the script from **File > Scripts > Run Script**
3. Choose an output folder
4. Each layer will be exported as `<layer-name>.png`

## The Script

```javascript
const doc = app.activeDocument;
if (!doc) {
  alert('No document open');
  exit;
}

const folder = Folder.selectDialog('Choose export folder');
if (!folder) exit;

for (const layer of doc.layers) {
  const filePath = new File(folder.fsName + '/' + layer.name + '.png');
  const opts = { dest: filePath, type: 'png', quality: 100 };
  layer.rasterize(opts);
}

alert('Exported ' + doc.layers.length + ' layers.');
```

## Notes

- Nested layers are not recursively exported — only top-level layers.
- Adjust the `type` in `opts` to export as `jpg`, `pdf`, etc.
- Add error handling for production use.
