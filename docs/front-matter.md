---
title: Front-matter
slug: front-matter
position: 0.99
---

# Front-matter

The [front-matter](https://jekyllrb.com/docs/front-matter/) plugin enables a key-value form that edits the front-matter contents of the markdown document while allowing the user to insert new rows.

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

The default key-value form preserves existing values such as `false`, `0`, and empty
strings when another field is edited. Dates are loaded with YAML's core schema and
remain strings. New and changed text values are saved as strings. Saving without
changes (including editing then reverting a field) keeps the original YAML, comments
and formatting. A changed save serializes the YAML
and may normalize formatting. Object and array values are retained but are not edited
by the text inputs. Frontmatter that cannot be safely edited in this form must be
changed in the Markdown source instead.

## Custom frontmatter editor

Pass a component to `frontmatterPlugin({ FrontmatterEditor: MyFrontmatterEditor })`
to replace the default form. The component receives `FrontmatterEditorProps`: the
current `yaml` string and an `onChange(yaml)` callback. Both strings contain only the
frontmatter contents, **without** the enclosing `---` delimiters. The component can
use `frontmatterDialogOpen$` to follow the toolbar's dialog state. Omit the option to
restore the default form; changing the component option updates existing frontmatter
nodes too.
