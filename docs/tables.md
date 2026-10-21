---
title: Tables
slug: tables
position: 0.5
---

# Tables

The table plugin enables the usage of [GFM markdown tables](https://github.github.com/gfm/#tables-extension-).

```tsx
const markdown = `
| foo | bar |
| --- | --- |
| baz | bim |
`
//...
<MDXEditor
  markdown={markdown}
  plugins={[
    tablePlugin(),
    toolbarPlugin({toolbarContents: () => <InsertTable />})
  ]
  }
/>
```

## The table editor

The table editor allows the user to insert and remove rows and columns and to change the alignment of the columns. Each cell can include markdown content like formatting, links, images, etc.

Use the **Table menu** in the upper-left corner to **Insert paragraph before table** or **Insert paragraph after table**. These actions work between adjacent tables and at document boundaries, and move focus into the paragraph so you can type immediately. The menu and both actions are keyboard-accessible.

An existing empty paragraph directly next to the table is reused. Opening the menu, hovering or focusing a table does not insert anything. Table actions are unavailable in read-only mode; existing cell Tab and Enter navigation is unchanged.

Pending edits in the active cell are saved before an insertion. Undoing a newly inserted paragraph keeps those cell edits. Empty paragraphs can disappear when Markdown is saved and reloaded, so use the action again if you have not yet typed any prose.

Note: HTML tables are not supported.
