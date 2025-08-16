/**
 * The `@mdxeditor/editor` package exports the MDXEditor React component and a set of plugins and
 * pre-made components for  editing/editor UI.
 *
 * The API Reference is organized around the various features of the editor. Usually, each feature is implemented as a plugin.
 *
 * Several note-worthy types of exports are available:
 *
 * **dollar-suffixed variables** (e.g. `markdown$`, `applyBlockType$`, etc.). These are [reactive Gurx primitives (Cells and Signals)](https://mdx-editor.github.io/gurx/)
 * which let you interact with the editor state and extend it with your own custom logic.
 *
 * The MDXEditor package re-exports Gurx's React hooks, so you can use them like this for example:
 * ```tsx
 * // use the markdown$ cell to get the current markdown value,
 * // and the rootEditor$ cell to get the Lexical editor instance.
 * const [markdown, rootEditor] = useCellValues([markdown$, rootEditor$])
 * // use the applyBlockType$ signal to apply a block type to the current selection
 * const applyBlockType = usePublisher(applyBlockType$)
 * ```
 *
 * **dollar-prefixed functions** (e.g. `$isCodeBlockNode`, etc.). These are following the conventions of the Lexical API, and are usually usable within the Lexical editor read/update cycles.
 *
 * **`plugin` functions** - these are functions that return a plugin object that can be passed to the `plugins` prop of the MDXEditor component. They usually accept a set of configuration options specific to the features they provide.
 *
 * **MDAST Nodes, Lexical Nodes and Import/Export visitors** - these are part of the bi-directional Markdown to/from Lexical state conversion API.
 *
 * **Toolbar plugins and primitives** - React components that can be used in the Editor toolbar. The primitives are meant to be used to build your own toolbar items.
 *
 * @packageDocumentation
 */
import './styles/globals.css'

export * from '@mdxeditor/gurx'
// editor component
export * from './MDXEditor'
export * from './defaultSvgIcons'

// import/export
export * from './importMarkdownToLexical'
export * from './exportMarkdownFromLexical'

// core so that you can build your own plugins
export * from './plugins/core'

// basics
export * from './plugins/headings'
export * from './plugins/thematic-break'
export * from './plugins/lists'
export * from './plugins/table'
export * from './plugins/link'
export * from './plugins/image'
export * from './plugins/frontmatter'
export * from './plugins/quote'
export * from './plugins/maxlength'

// JSX
export * from './plugins/jsx'
export * from './jsx-editors/GenericJsxEditor'

// code blocks
export * from './plugins/sandpack'
export * from './plugins/sandpack/SandpackEditor'
export * from './plugins/codemirror'
export * from './plugins/codemirror/CodeMirrorEditor'
export * from './plugins/codeblock'

// directives
export * from './plugins/directives'
export * from './directive-editors/AdmonitionDirectiveDescriptor'
export * from './directive-editors/GenericDirectiveEditor'

// UI
export * from './plugins/link-dialog'

export * from './plugins/toolbar'

export * from './plugins/diff-source'
export * from './plugins/markdown-shortcut'

export * from './plugins/search'

// Toolbar components
export * from './plugins/toolbar/components/BlockTypeSelect'
export * from './plugins/toolbar/components/BoldItalicUnderlineToggles'
export * from './plugins/toolbar/components/ChangeAdmonitionType'
export * from './plugins/toolbar/components/ChangeCodeMirrorLanguage'
export * from './plugins/toolbar/components/CodeToggle'
export * from './plugins/toolbar/components/HighlightToggle'
export * from './plugins/toolbar/components/CreateLink'
export * from './plugins/toolbar/components/DiffSourceToggleWrapper'
export * from './plugins/toolbar/components/InsertAdmonition'
export * from './plugins/toolbar/components/InsertCodeBlock'
export * from './plugins/toolbar/components/InsertFrontmatter'
export * from './plugins/toolbar/components/InsertImage'
export * from './plugins/toolbar/components/InsertSandpack'
export * from './plugins/toolbar/components/InsertTable'
export * from './plugins/toolbar/components/InsertThematicBreak'
export * from './plugins/toolbar/components/ListsToggle'
export * from './plugins/toolbar/components/ShowSandpackInfo'
export * from './plugins/toolbar/components/UndoRedo'
export * from './plugins/toolbar/components/KitchenSinkToolbar'

// Build your own toolbar items
export * from './plugins/toolbar/primitives/toolbar'
export * from './plugins/toolbar/primitives/DialogButton'
export * from './plugins/toolbar/primitives/TooltipWrap'
export * from './plugins/toolbar/primitives/select'

// Build your own editor
export * from './plugins/core/NestedLexicalEditor'
export * from './plugins/core/PropertyPopover'
export * from './plugins/remote'

// Helpers & utilities
export * from './utils/detectMac'
export * from './utils/fp'
export * from './utils/isPartOftheEditorUI'
export * from './utils/lexicalHelpers'
export * from './utils/makeHslTransparent'
export * from './utils/uuid4'
export * from './utils/voidEmitter'

export * from './RealmWithPlugins'

export * from './FormatConstants'

export * from './styles/lexicalTheme'

import * as lexical from 'lexical'
export { lexical }
