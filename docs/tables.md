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

The table editor allows the user to insert and remove rows and columns and to change the alignment of the columns. 
Each cell can include markdown content like formatting, links, images, etc.

Note: HTML tables are not supported. 
