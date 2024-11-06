---
title: Toolbar
slug: customizing-toolbar
position: 0.2
---

# Toolbar

MDXEditor includes a toolbar plugin and a set of toolbar components that you can arrange up to your preferences and the features you have enabled. Most toolbar components need their respective plugins to be enabled in order to work correctly. The next example enables a simple toolbar with undo/redo and bold/italic/underline components in it. Following the same pattern, you can add, rearrange, or add custom toolbar components.

Note: Most of the components do not accept any properties, but some read the configuration parameters of their respective plugins. A notable exception is the `DiffSourceToggleWrapper` which requires its children to be the toolbar contents.

```tsx
import '@mdxeditor/editor/style.css'
import { MDXEditor, UndoRedo, BoldItalicUnderlineToggles, toolbarPlugin } from '@mdxeditor/editor'

function App() {
  return (
    <MDXEditor
      markdown="Hello world"
      plugins={[
        toolbarPlugin({
          toolbarClassName: 'my-classname',
          toolbarContents: () => (
            <>
              {' '}
              <UndoRedo />
              <BoldItalicUnderlineToggles />
            </>
          )
        })
      ]}
    />
  )
}

export default App
```

## Built-in toolbar components

The package comes with a set of built-in toolbar components that give access to the capabilities of the editor. Below is a list of the available components and the plugins they require.

### `BlockTypeSelect`

A toolbar component that allows the user to change the block type of the current selection. Supports paragraphs, headings, and block quotes.

### `BoldItalicUnderlineToggles`

A toolbar component that lets the user toggle bold, italic, and underline formatting.

### `ChangeAdmonitionType`

A component that allows the user to change the admonition type of the current selection. For this component to work, you must pass the `AdmonitionDirectiveDescriptor` to the `directivesPlugin` `directiveDescriptors` parameter.

### `ChangeCodeMirrorLanguage`

A component that allows the user to change the code block language of the current selection. For this component to work, you must enable the `codeMirrorPlugin` for the editor. See the `ConditionalContents` API reference for an example of how to display the dropdown only when a code block is in focus.

### `CodeToggle`

A toolbar component that lets the user toggle code formatting. Use for inline `code` elements (like variables, methods, etc).

### `CreateLink`

A toolbar component that opens the link edit dialog. For this component to work, you must include the `linkDialogPlugin`.

### `DiffSourceToggleWrapper`

A wrapper element for the toolbar contents that lets the user toggle between rich text, diff, and source mode. Put the rich text toolbar contents as children of this component. For this component to work, you must include the `diffSourcePlugin`.

### `InsertAdmonition`

A toolbar dropdown button that allows the user to insert admonitions. For this to work, you need to have the `directives` plugin enabled with the `AdmonitionDirectiveDescriptor` configured.

### `InsertCodeBlock`

A toolbar button that allows the user to insert a fenced code block. Once the code block is focused, you can construct a special code block toolbar for it, using the `ConditionalContents` primitive. See the `ConditionalContents` documentation for an example.

### `InsertFrontmatter`

A toolbar button that allows the user to insert a [front-matter](https://jekyllrb.com/docs/front-matter/) editor (if one is not already present). For this to work, you need to have the `frontmatterPlugin` plugin enabled.

### `InsertImage`

A toolbar button that allows the user to insert an image from a URL. For the button to work, you need to have the `imagePlugin` plugin enabled.


### `InsertTable`

A toolbar button that allows the user to insert a table. For this button to work, you need to have the `tablePlugin` plugin enabled.

### `InsertThematicBreak`

A toolbar button that allows the user to insert a thematic break (rendered as an HR HTML element). For this button to work, you need to have the `thematicBreakPlugin` plugin enabled.

### `ListsToggle`

A toolbar toggle that allows the user to toggle between bulleted and numbered lists. Pressing the selected button will convert the current list to the other type. Pressing it again will remove the list. For this button to work, you need to have the `listsPlugin` plugin enabled.


### `UndoRedo`

A toolbar component that lets the user undo and redo changes in the editor.

## Toolbar primitives for custom components

The editor toolbar is a styled wrapper around the Radix UI [Toolbar](https://radix-ui.com/primitives/docs/components/toolbar) component.
To maintain consistent styling with the existing tools in your own components, you can use the primitives listed below.

### `SingleChoiceToggleGroup`

A toolbar primitive that allows you to build a UI with multiple exclusive toggle groups, like the list type toggle.

### `Separator`

A toolbar primitive that allows you to show a separator between toolbar items. By default, the separator is styled as a vertical line.

### `Select`

A toolbar primitive you can use to build dropdowns, such as the block type select.

### `MultipleChoiceToggleGroup`

A toolbar primitive that allows you to build a UI with multiple non-exclusive toggle groups, like the bold/italic/underline toggle.

### `DialogButton`

Use this primitive to create a toolbar button that opens a dialog with text input, autocomplete suggestions, and a submit button.

### `ConditionalContents`

A toolbar primitive that allows you to show different contents based on the editor that is in focus. Useful for code editors that have different features and don't support rich text formatting.

### `ButtonWithTooltip`

A toolbar button with a custom toolbar primitive.

### `Button`

A vanilla toolbar button primitive.

### `ButtonOrDropdownButton`

Use this primitive to create a toolbar button that can be either a button or a dropdown, depending on the number of items passed.
