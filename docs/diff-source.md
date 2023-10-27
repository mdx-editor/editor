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

