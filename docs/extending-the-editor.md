---
title: Extending the editor
slug: extending-the-editor
position: 99
---

# Extending the editor

MDXEditor code base is built with extensibility in mind. In fact, even the core editor behavior is built as a plugin. In here, we will cover the conceptual design of the codebase without touching on the specifics of the API. 

## The state management model

MDXEditor uses a composable, graph-based reactive state management system internally. When initialized, the component creates multiple systems of stateful and stateless observables (called nodes) into a **realm**. 
From there on, the React layer (properties, user input, etc) and the Lexical editor interact with the realm by publishing into certain nodes and or by subscribing to changes in node values. 

Each editor plugin can declare a set of nodes (called **system**) and their interactions. The new nodes can optionally interact with the existing nodes if you declare the built-in systems as dependencies of the system. A good (yet not-so-complex) example of [such system is the diff-source plugin](https://github.com/mdx-editor/editor/blob/plugins/src/plugins/diff-source/index.tsx), that interacts with the core system to change the value of the 'markdown' node when the user edits the content in source mode.

The state management systems are strongly typed. When you declare one as a dependency, the injected nodes will be available to you with strict TypeScript types defined. 

The example below illustrates how state management systems work in practice:
```tsx
import { realmPlugin, system } from '@mdxeditor/editor'

// The r(realm) parameter passed to the system constructor is the realm instance that is used 
// to declare new nodes, and to connect existing nodes with operators. 
// The operators are similar to the RxJS operators.
const mySystem = system((r) => {
  // declare a stateful node that holds a string value.
  const myNode = r.node("") 
  // This is a stateless node - it can be used as a signal pipe to pass values that trigger events in the system.
  const mySignal = r.node<number>()
  
  // connect the signal node to the stateful node using the `pipe` operator.
  // The pipe operator will execute the callback whenever the signal node changes.
  r.link(r.pipe(mySignal, r.o.map(v => `mySignal has been called ${v} times`)), myNode)

  // Finally, export the nodes that should be accessible from outside (like the React components, for example).
  return {
    myNode, 
    mySignal
  }
// the empty array below is the list of dependencies. 
}, [])

// We can construct a new system that interacts with the nodes from the system above.
// The system constructor receives a tuple of dependencies, where the first element is the realm instance, 
// and the second element is the list of nodes exported by the dependency systems.
const myOtherSystem = system((r, [{myNode}]) => {
  // declare a stateful node that holds a string value.
  const myOtherNode = r.node("") 

  // connect the stateful node to the stateful node from the other system.
  r.link(myNode, myOtherNode)

  return {
    myOtherNode
  }
}, [mySystem])
```

Following the approach above, you can access the built-in state management systems of the package. The most important one being the `coreSystem` - it includes stateful nodes like the `rootEditor` (the Lexical instance), `activeEditor` (can be the root editor or one of the nested editors). It also exposes convenient signals like `createRootEditorSubscription` and `createActiveEditorSubscription` that let you [hook up to the Lexical editor commands](https://lexical.dev/docs/concepts/commands#editorregistercommand).

Most of the plugin systems also expose signal nodes that let you insert certain node types into the editor. For example, the `codeBlockSystem` has a node `insertCodeBlockNode` that can be used to insert a code block into the editor. 

## Accessing the state from React

The `realmPlugin` call returns the plugin itself and a set of React hooks (by convention, named `<plugin>Hooks`) that let you interact with the nodes declared in the plugin system and its dependencies. The hooks return the node values or functions that can be used to publish into certain nodes. The next example is taken from the diff-source plugin Toolbar item:

```tsx
export const DiffSourceToggleWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // access the viewMode node value 
  const [viewMode] = diffSourcePluginHooks.useEmitterValues('viewMode')
  // a function that will publish a new value into the viewMode node
  const changeViewMode = diffSourcePluginHooks.usePublisher('viewMode')

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

In addition to `useEmitterValues` and `usePublisher`, you can also use the `useEmitter` hook that will execute the provided callback when node changes without causing a re-render. 
While using strings for the nodes, the hooks have strict TypeScript typings, so you should be able to get autocompletion of the nodes you can access.

## Markdown / Editor state conversion

In its `init` method, a plugin can specify a set of MDAST/Lexical **visitors** that will be used to convert the markdown source into the editor state and vice versa. 
The visitors are plugged into the core system visitors node and then used for processing the markdown input/output. 
The easiest way for you to get a grip of the mechanism is to take a look at the [core plugin visitors](https://github.com/mdx-editor/editor/tree/main/src/plugins/core), that are used to process the basic nodes like paragraphs, bold, italic, etc. The registration of each visitor looks like this (excerpt from the `core` plugin):

```tsx
// core import visitors
realm.pubKey('addImportVisitor', MdastRootVisitor)
realm.pubKey('addImportVisitor', MdastParagraphVisitor)
realm.pubKey('addImportVisitor', MdastTextVisitor)
realm.pubKey('addImportVisitor', MdastFormattingVisitor)
realm.pubKey('addImportVisitor', MdastInlineCodeVisitor)

// core export visitors
realm.pubKey('addExportVisitor', LexicalRootVisitor)
realm.pubKey('addExportVisitor', LexicalParagraphVisitor)
realm.pubKey('addExportVisitor', LexicalTextVisitor)
realm.pubKey('addExportVisitor', LexicalLinebreakVisitor)
```

## Interacting with Lexical

The actual rich-text editing experience is built on top of the [Lexical framework](https://lexical.dev) and its node model. In addition to the out-of-the-box nodes (like paragraph, heading, etc), MDXEditor implements a set of custom nodes that are used for the advanced editors (like the table editor, the image editor, and the code block editor). 

Lexical is a powerful framework, so understanding its concepts is a challenge on its own. After [the docs themselves](https://lexical.dev/), A good place to start learning by example is the [Lexical playground source code](https://github.com/facebook/lexical/tree/main/packages/lexical-playground).

*Note: Lexical has its own react-based plugin system, which MDXEditor does not use. It is possible to initialize a React-based lexical plugin through the `realmPlugin` function - [here's how this is done in the listsPlugin, for example](https://github.com/mdx-editor/editor/blob/ff717593f32bb76092524006f4a3bd9446b208e8/src/plugins/lists/index.ts#L93-L94)*. 
