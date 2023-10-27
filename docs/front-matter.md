---
title: Front-matter
slug: front-matter
position: 0.99
---

# Front-matter

The [front-matter](https://jekyllrb.com/docs/front-matter/) plugin enables an key-value form that edits the front-matter contents of the markdown document, while allowing the user to insert new rows. 

```tsx
// you can try a markdown without the front-matter, 
// the `InsertFrontmatter` button from the toolbar will create a new block.

const frontmatterMarkdown = `
---
slug: hello-world
---

this is a cool markdown
`

export function Frontmatter() {
  return (
    <MDXEditor
      markdown={frontmatterMarkdown}
      plugins={[frontmatterPlugin(), toolbarPlugin({ toolbarContents: () => <InsertFrontmatter /> })]}
    />
  )
}
```
