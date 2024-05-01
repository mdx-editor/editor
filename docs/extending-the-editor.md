---
title: Extending the editor
slug: extending-the-editor
position: 99
---

# Extending the editor

The MDXEditor code base is built with extensibility in mind. Even the core editor behavior is built as a plugin. In this section, we will cover the conceptual design of the codebase without touching on the specifics of the API.

## The state management model

MDXEditor uses a composable, graph-based reactive state management system [called Gurx](https://mdx-editor.github.io/gurx). When initialized, the component creates multiple systems of stateful and stateless observables (called Cells, Signals, and Actions) into a **realm**.
From there on, the React layer (properties, user input, etc) and the Lexical editor interact with the realm by publishing into certain nodes and or by subscribing to changes in node values.

The example below illustrates how state management systems work in practice:

```tsx
// MDXEditor re-exports the Gurx library features
import { realmPlugin, Cell, Signal } from '@mdxeditor/editor'

// declare a stateful cell that holds a string value.
const myCell$ = Cell('')

// This is a stateless signal - it can be used as a pipe to pass values that trigger events in the system.
// The r(realm) parameter passed to the signa initializer is the realm instance
const mySignal$ = Signal<number>((r) => {
  // connect the signal node to the cell using the `pipe` operator.
  // The pipe operator will execute the callback whenever the signal node changes.
  r.link(
    r.pipe(
      mySignal$,
      r.o.map((v) => `mySignal has been called ${v} times`)
    ),
    myCell$
  )
})
```

Following the approach above, you can access and interact with the built-in cells and signals that the package exports. As a convention, the Cells and Signals are suffixed with `$`. You would most likely need to interact with `rootEditor$` (the Lexical instance), `activeEditor$` (can be the root editor or one of the nested editors). Signals like `createRootEditorSubscription$` and `createActiveEditorSubscription$` let you [hook](https://lexical.dev/docs/concepts/commands#editorregistercommand) up to the [Lexical editor commands](https://lexical.dev/docs/concepts/commands#editorregistercommand).

Some of the plugins expose signals that let you insert certain node types into the editor. For example, the `codeBlockPlugin` has an `insertCodeBlockNode$` that can be used to insert a code block into the editor.

## Accessing the state from React

Gurx provides a set of hooks that let you access the state from React. Use `useCellValue` or `useCellValues` to get the values of certain cells - the components will re-render when the cell(s) emit new values. To publish a value into a cell, signal, or action, use the `usePublisher` hook.

```tsx
export const DiffSourceToggleWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // access the viewMode node value
  const viewMode = useCellValue(viewMode$)

  // a function that will publish a new value into the viewMode cell
  const changeViewMode = usePublisher(viewMode$)

  return (
    <>
      {viewMode === 'rich-text' ? (
        children
      ) : viewMode === 'diff' ? (
        <span className={styles.toolbarTitleMode}>Diff mode</span>
      ) : (
        <span className={styles.toolbarTitleMode}>Source mode</span>
      )}

      <div style={{ marginLeft: 'auto' }}>
        <SingleChoiceToggleGroup
          className={styles.diffSourceToggle}
          value={viewMode}
          items={[
            { title: 'Rich text', contents: <RichTextIcon />, value: 'rich-text' },
            { title: 'Diff mode', contents: <DiffIcon />, value: 'diff' },
            { title: 'Source', contents: <SourceIcon />, value: 'source' }
          ]}
          onChange={(value) => changeViewMode(value || 'rich-text')}
        />
      </div>
    </>
  )
}
```

## Creating a custom plugin

For simpler use cases, you might not need to explicitly declare a new plugin. If you declare a set of cells/signals and then use them in a React component, they will be automatically included in the Editor's realm. However, if you need to run some custom initialization logic or if you need to parameterize a certain behavior, the plugin format is the way to go. A common reason for a plugin might be the customization of the Markdown import/export behavior. The code below is an annotated version of the Headings plugin with some parts removed for brevity. You can browse the source of the editor and its plugins for more examples.

```tsx
//... imports
import { LexicalHeadingVisitor } from './LexicalHeadingVisitor'
import { MdastHeadingVisitor } from './MdastHeadingVisitor'

// A gurx cell that contains list of all heading levels that can be used in the editor.
export const allowedHeadingLevels$ = Cell<ReadonlyArray<HEADING_LEVEL>>(ALL_HEADING_LEVELS, (r) => {
  // Creates a subscription for the root editor for the purpose of makin ctrl+alt+(1|2|3) convert the current selection into a heading.
  // the createRootEditorSubscription$ is a signal exposed by the core plugin.
  r.pub(createRootEditorSubscription$, (theRootEditor) => {
    return theRootEditor.registerCommand<KeyboardEvent>(
      KEY_DOWN_COMMAND,
      (event) => {
        // omitted for brevity - see the lexical docs for more info on editor commands.
      },
      COMMAND_PRIORITY_LOW
    )
  })
})

// The actual plugin.
// The generic type parameter is used to specify the params accepted by the resulting function.
// Those params are passed to the init/update functions.
export const headingsPlugin = realmPlugin<{
  /**
   * Allows you to limit the headings used in the editor. Affects the block type dropdown and the keyboard shortcuts.
   * @default [1, 2, 3, 4, 5, 6]
   */
  allowedHeadingLevels?: ReadonlyArray<HEADING_LEVEL>
}>({
  init(realm) {
    // In here, we publish the necessary import/export visitors (omitted here, check the full source in github) into their respective signals.
    // That's how the editor knows how to convert the MDAST Heading nodes into lexical nodes and vice versa.
    // We're also registering the necessary Lexical node (HeadingNode) for the Lexical editor instance.
    realm.pubIn({
      [addActivePlugin$]: 'headings',
      [addImportVisitor$]: MdastHeadingVisitor,
      [addLexicalNode$]: HeadingNode,
      [addExportVisitor$]: LexicalHeadingVisitor
    })
  },
  update(realm, params) {
    // The update function is called with each re-render.
    // re-publishing into the allowedHeadingLevels$ cell means that you can change the allowed heading levels at any time (not just when the component mounts).
    //
    realm.pub(allowedHeadingLevels$, params?.allowedHeadingLevels ?? ALL_HEADING_LEVELS)
  }
})
```

## Markdown / Editor state conversion

The markdown import/export visitors are used for processing the markdown input/output.

The easiest way for you to get a grip of the mechanism is to take a look at the [core plugin visitors](https://github.com/mdx-editor/editor/tree/main/src/plugins/core), that are used to process the basic nodes like paragraphs, bold, italic, etc. The registration of each visitor looks like this (excerpt from the `core` plugin):

```tsx
// core import visitors
realm.pub(addImportVisitor$, MdastRootVisitor)
realm.pub(addImportVisitor$, MdastParagraphVisitor)
realm.pub(addImportVisitor$, MdastTextVisitor)
realm.pub(addImportVisitor$, MdastFormattingVisitor)
realm.pub(addImportVisitor$, MdastInlineCodeVisitor)

// core export visitors
realm.pub(addExportVisitor$, LexicalRootVisitor)
realm.pub(addExportVisitor$, LexicalParagraphVisitor)
realm.pub(addExportVisitor$, LexicalTextVisitor)
realm.pub(addExportVisitor$, LexicalLinebreakVisitor)
```

## Interacting with Lexical

The MDXEditor rich-text editing is built on top of the [Lexical framework](https://lexical.dev) and its node model. In addition to the out-of-the-box nodes (like paragraph, heading, etc), MDXEditor implements a set of custom nodes that are used for the advanced editors (like the table editor, the image editor, and the code block editor).

Lexical is a powerful framework, so understanding its concepts is a challenge on its own. After [the docs themselves](https://lexical.dev/), A good place to start learning by example is the [Lexical playground source code](https://github.com/facebook/lexical/tree/main/packages/lexical-playground).

_Note: Lexical has its own react-based plugin system, which MDXEditor does not use._
