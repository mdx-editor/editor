---
title: Toolbar
slug: customizing-toolbar
position: 0.2
---

# Toolbar

MDXEditor includes a toolbar plugin and a set of toolbar components that you can arrange up to your preferences and the features you have enabled. Most toolbar components need their respective plugins to be enabled in order to work correctly. The next example enables a simple toolbar with undo/redo and bold/italic/underline components in it. Following the same pattern, you can add, rearrange, or add custom toolbar components.

Note: Most of the components accept any properties, but some read the configuration parameters of their respective plugins. A notable exception is the DiffSourceToggleWrapper which requires its children to be the toolbar contents.

```tsx
import '@mdxeditor/editor/style.css'
import { MDXEditor } from '@mdxeditor/editor/MDXEditor'
import { UndoRedo } from '@mdxeditor/editor/plugins/toolbar/components/UndoRedo'
import { BoldItalicUnderlineToggles } from '@mdxeditor/editor/plugins/toolbar/components/BoldItalicUnderlineToggles'
import { toolbarPlugin } from '@mdxeditor/editor/plugins/toolbar'

function App() {
  return (
    <MDXEditor markdown='Hello world' 
      plugins={[toolbarPlugin({
        toolbarContents: () => ( <> <UndoRedo /><BoldItalicUnderlineToggles /></>)
      })]}
    />
  )
}

export default App
```

## Built-in toolbar components

The package comes with a set of built-in toolbar components that give access to the capabilities of the editor. Below is a list of the available components and the plugins they require.

###  [BlockTypeSelect](../api/editor.blocktypeselect) 

A toolbar component that allows the user to change the block type of the current selection. Supports paragraphs, headings and block quotes. 

###  [BoldItalicUnderlineToggles](../api/editor.bolditalicunderlinetoggles) 

A toolbar component that lets the user toggle bold, italic and underline formatting. 

###  [ChangeAdmonitionType](../api/editor.changeadmonitiontype) 

A component that allows the user to change the admonition type of the current selection. For this component to work, you must pass the [AdmonitionDirectiveDescriptor](../api/editor.admonitiondirectivedescriptor) to the <code>directivesPlugin</code> <code>directiveDescriptors</code> parameter. 

###  [ChangeCodeMirrorLanguage](../api/editor.changecodemirrorlanguage) 

A component that allows the user to change the code block language of the current selection. For this component to work, you must enable the <code>codeMirrorPlugin</code> for the editor. See [ConditionalContents](../api/editor.conditionalcontents) for an example on how to display the dropdown only when a code block is in focus. 

###  [CodeToggle](../api/editor.codetoggle) 

A toolbar component that lets the user toggle code formatting. Use for inline <code>code</code> elements (like variables, methods, etc). 

###  [CreateLink](../api/editor.createlink) 

A toolbar component that opens the link edit dialog. For this component to work, you must include the <code>linkDialogPlugin</code>. 

###  [DiffSourceToggleWrapper](../api/editor.diffsourcetogglewrapper) 

A wrapper element for the toolbar contents that lets the user toggle between rich text, diff and source mode. Put the rich text toolbar contents as children of this component. For this component to work, you must include the <code>diffSourcePlugin</code>. 

###  [InsertAdmonition](../api/editor.insertadmonition) 

A toolbar dropdown button that allows the user to insert admonitions. For this to work, you need to have the <code>directives</code> plugin enabled with the [AdmonitionDirectiveDescriptor](../api/editor.admonitiondirectivedescriptor) configured. 

###  [InsertCodeBlock](../api/editor.insertcodeblock) 

A toolbar button that allows the user to insert a fenced code block. Once the code block is focused, you can construct a special code block toolbar for it, using the [ConditionalContents](../api/editor.conditionalcontents) primitive. See the [ConditionalContents](../api/editor.conditionalcontents) documentation for an example. 

###  [InsertFrontmatter](../api/editor.insertfrontmatter) 

A toolbar button that allows the user to insert a [front-matter](https://jekyllrb.com/docs/front-matter/) editor (if one is not already present). For this to work, you need to have the <code>frontmatterPlugin</code> plugin enabled. 

###  [InsertImage](../api/editor.insertimage) 

A toolbar button that allows the user to insert an image from an URL. For the button to work, you need to have the <code>imagePlugin</code> plugin enabled. 

###  [InsertSandpack](../api/editor.insertsandpack) 

A dropdown button that allows the user to insert a live code block into the editor. The dropdown offers a list of presets that are defined in the sandpack plugin config. For this to work, you need to have the <code>sandpackPlugin</code> installed. 

###  [InsertTable](../api/editor.inserttable) 

A toolbar button that allows the user to insert a table. For this button to work, you need to have the <code>tablePlugin</code> plugin enabled. 

###  [InsertThematicBreak](../api/editor.insertthematicbreak) 

A toolbar button that allows the user to insert a thematic break (rendered as an HR HTML element). For this button to work, you need to have the <code>thematicBreakPlugin</code> plugin enabled. 

###  [ListsToggle](../api/editor.liststoggle) 

A toolbar toggle that allows the user to toggle between bulleted and numbered lists. Pressing the selected button will convert the current list to the other type. Pressing it again will remove the list. For this button to work, you need to have the <code>listsPlugin</code> plugin enabled. 

###  [ShowSandpackInfo](../api/editor.showsandpackinfo) 

A component that displays the focused live code block's name. For this component to work, you must enable the <code>sandpackPlugin</code> for the editor. See [ConditionalContents](../api/editor.conditionalcontents) for an example on how to display the dropdown only when a Sandpack editor is in focus. 

###  [UndoRedo](../api/editor.undoredo) 

A toolbar component that lets the user undo and redo changes in the editor. 


## Toolbar primitives for custom components

The editor toolbar is a styled wrapper around the Radix UI [Toolbar](https://radix-ui.com/primitives/docs/components/toolbar) component. 
To maintain consistent styling with the existing tools in your own components, you can use the primitives listed below.

###  [SingleChoiceToggleGroup](../api/editor.singlechoicetogglegroup) 

A toolbar primitive that allows you to build an UI with multiple exclusive toggle groups, like the list type toggle. 

###  [Separator](../api/editor.separator) 

A toolbar primitive that allows you to show a separator between toolbar items. By default, the separator is styled as vertical line. 

###  [Select](../api/editor.select) 

A toolbar primitive you can use to build dropdowns, such as the block type select. See [SelectProps](../api/editor.selectprops) for more details. 

###  [MultipleChoiceToggleGroup](../api/editor.multiplechoicetogglegroup) 

A toolbar primitive that allows you to build an UI with multiple non-exclusive toggle groups, like the bold/italic/underline toggle. 

###  [DialogButton](../api/editor.dialogbutton) 

Use this primitive to create a toolbar button that opens a dialog with a text input, autocomplete suggestions, and a submit button.

See [DialogButtonProps](../api/editor.dialogbuttonprops) for the properties that can be passed to this component. 


###  [ConditionalContents](../api/editor.conditionalcontents) 

A toolbar primitive that allows you to show different contents based on the editor that is in focus. Useful for code editors that have different features and don't support rich text formatting. 

###  [ButtonWithTooltip](../api/editor.buttonwithtooltip) 

A toolbar button with a custom toolbar primitive. 

###  [Button](../api/editor.button) 

A toolbar button primitive. 

###  [ButtonOrDropdownButton](../api/editor.buttonordropdownbutton) 

Use this primitive to create a toolbar button that can be either a button or a dropdown, depending on the number of items passed. 
