/**
 * The `@mdxeditor/editor` package exports the MDXEditor React component, along with some utilities and default option values that id the customization of the widget.
 * In addition to that, the package exports the LexicalNodes used to represent the MDX AST, as well as the NodeDecorators used to render the nodes in the editor.
 *
 * @packageDocumentation
 */

export type { MDXEditorMethods, MDXEditorCoreProps } from './MDXEditorCore'
export type { JsxComponentDescriptor, JsxPropertyDescriptor } from './plugins/jsx'
export type { SandpackConfig, SandpackPreset } from './plugins/sandpack'
export type { CodeBlockEditorDescriptor } from './plugins/codeblock'
export type { DirectiveDescriptor } from './plugins/directives'

// Basics
export { MDXEditorCore } from './MDXEditorCore'
export { headingsPlugin } from './plugins/headings'
export { thematicBreakPlugin } from './plugins/thematic-break'
export { listsPlugin } from './plugins/lists'
export { tablePlugin } from './plugins/table'
export { linkPlugin } from './plugins/link'
export { imagePlugin } from './plugins/image'
export { frontmatterPlugin } from './plugins/frontmatter'
export { quotePlugin } from './plugins/quote'

// JSX
export { jsxPlugin } from './plugins/jsx'
export { GenericJsxEditor } from './jsx-editors/GenericJsxEditor'

// code blocks
export { sandpackPlugin } from './plugins/sandpack'
export { codeMirrorPlugin } from './plugins/codemirror'
export { codeBlockPlugin } from './plugins/codeblock'
export { useCodeBlockEditorContext } from './plugins/codeblock/CodeBlockNode'

// directives
export { directivesPlugin } from './plugins/directives'
export { AdmonitionDirectiveDescriptor } from './directive-editors/AdmonitionDirectiveDescriptor'
export { GenericDirectiveEditor } from './directive-editors/GenericDirectiveEditor'

// UI
export { linkDialogPlugin } from './plugins/link-dialog'

export { toolbarPlugin } from './plugins/toolbar'
