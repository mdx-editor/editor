---
title: Diff/source mode
slug: diff-source
position: 0.7
---

# Diff/source mode

The diff/source plugin allows the user to switch to editing the markdown source of the document or to compare it to the initial version of the document.
It's an useful integration if you're building something for power users that are familiar with markdown. The plugin is enabled by the `DiffSourceToggleWrapper` toolbar component.

```tsx
<MDXEditor
  onChange={console.log}
  markdown={'hello world'}
  plugins={[
    // the viewMode parameter lets you switch the editor to diff or source mode.
    // you can get the diffMarkdown from your backend and pass it here.
    diffSourcePlugin({ diffMarkdown: 'An older version', viewMode: 'rich-text' }),
    toolbarPlugin({
      toolbarContents: () => (
        <DiffSourceToggleWrapper>
          <UndoRedo />
        </DiffSourceToggleWrapper>
      )
    })
  ]}
/>
```

## Read-Only Diff mode

You can enable the read-only mode for the diff viewer in two ways:

1. Use the `readOnly` flag on the `MDXEditor` - this makes the entire editor read-only, including both the source and rich-text modes.
2. Use the `readOnlyDiff` flag on the `diffSourcePlugin` - this makes only the diff mode read-only.

For example, the code below will display the differences but prevent code editing in diff view:

```tsx
<MDXEditor
  markdown={'hello world'}
  plugins={[
    diffSourcePlugin({
      diffMarkdown: 'An older version',
      viewMode: 'diff',
      readOnlyDiff: true
    })
  ]}
/>
```

And this code will prevent any code changes in any mode:

```tsx
<MDXEditor
  markdown={'hello world'}
  readOnly={true}
  plugins={[
    diffSourcePlugin({
      diffMarkdown: 'An older version',
      viewMode: 'diff'
    })
  ]}
/>
```
