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

## Structured values

The dialog edits nested objects and arrays recursively. Each value has an explicit
string, number, boolean, null, object, or array type. Boolean values use checkboxes;
strings support multiple lines. Empty strings, zero, false, null, empty collections,
and fields unknown to the application are retained. Changing a type replaces that
value with an empty value of the selected type. Array entries retain their order.
Duplicate object keys, incomplete/non-finite numbers, and integers outside JavaScript's
safe integer range prevent field-based saving. Use a string for a large identifier.

Changes stay in the dialog until Save. Cancel, Escape, and closing the dialog discard
unsaved edits. Reopening uses the current document, including changes made by undo or
`setMarkdown`. Save is one undoable document update; read-only editors disable edits,
saving, and removal. The explicit Remove frontmatter button removes the whole block.

Malformed YAML opens as source text with an error instead of crashing the editor.
Correct the YAML and save, or cancel to retain the original. Integers outside JavaScript's
safe integer range, recursive aliases,
unsupported YAML tags and excessively deep/large field trees also use the source
editor. Basic structured editing uses the YAML core schema, so date-like values remain
strings. Saving changed fields serializes YAML and may normalize formatting, comments,
and anchors; saving without edits leaves the original YAML untouched.

No schema or form library is required. Application-specific schema validation and
custom field widgets are outside the scope of this editor.
