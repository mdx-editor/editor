/**
 * The `@mdxeditor/editor` package exports the MDXEditor React component and a set of plugins and pre-made components for custom editing/editor chrome.
 * @packageDocumentation
 */
import './styles/globals.css'

// editor copmonent
export * from './MDXEditor'

// basics
export * from './plugins/headings'
export * from './plugins/thematic-break'
export * from './plugins/lists'
export * from './plugins/table'
export * from './plugins/link'
export * from './plugins/image'
export * from './plugins/frontmatter'
export * from './plugins/quote'

// JSX
export * from './plugins/jsx'
export * from './jsx-editors/GenericJsxEditor'

// code blocks
export * from './plugins/sandpack'
export * from './plugins/codemirror'
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

// Toolbar components
export * from './plugins/toolbar/components/BlockTypeSelect'
export * from './plugins/toolbar/components/BoldItalicUnderlineToggles'
export * from './plugins/toolbar/components/ChangeAdmonitionType'
export * from './plugins/toolbar/components/ChangeCodeMirrorLanguage'
export * from './plugins/toolbar/components/CodeToggle'
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
