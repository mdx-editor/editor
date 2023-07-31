/**
 * The `@mdxeditor/editor` package exports the MDXEditor React component, along with some utilities and default option values that id the customization of the widget.
 * In addition to that, the package exports the LexicalNodes used to represent the MDX AST, as well as the NodeDecorators used to render the nodes in the editor.
 *
 * @packageDocumentation
 */

export type { MDXEditorMethods, MDXEditorCoreProps } from './MDXEditorCore'
export type { JsxComponentDescriptor, JsxPropertyDescriptor } from './plugins/jsx/realmPlugin'
export type { SandpackConfig, SandpackPreset } from './plugins/sandpack/realmPlugin'
export type { CodeBlockEditorDescriptor } from './plugins/codeblock/realmPlugin'
export type { DirectiveDescriptor } from './plugins/directives/realmPlugin'

// Basics
export { MDXEditorCore } from './MDXEditorCore'
export { headingsPlugin } from './plugins/headings/realmPlugin'
export { thematicBreakPlugin } from './plugins/thematic-break/realmPlugin'
export { listsPlugin } from './plugins/lists/realmPlugin'
export { tablePlugin } from './plugins/table/realmPlugin'
export { linkPlugin } from './plugins/link/realmPlugin'
export { imagePlugin } from './plugins/image/realmPlugin'
export { frontmatterPlugin } from './plugins/frontmatter/realmPlugin'
export { quotePlugin } from './plugins/quote/realmPlugin'

// JSX
export { jsxPlugin } from './plugins/jsx/realmPlugin'
export { GenericJsxEditor } from './jsx-editors/GenericJsxEditor'

// code blocks
export { sandpackPlugin } from './plugins/sandpack/realmPlugin'
export { codeMirrorPlugin } from './plugins/codemirror/realmPlugin'
export { codeBlockPlugin } from './plugins/codeblock/realmPlugin'
export { useCodeBlockEditorContext } from './plugins/codeblock/CodeBlockNode'

// directives
export { directivesPlugin } from './plugins/directives/realmPlugin'
export { AdmonitionDirectiveDescriptor } from './directive-editors/AdmonitionDirectiveDescriptor'
export { GenericDirectiveEditor } from './directive-editors/GenericDirectiveEditor'

// UI
export { linkDialogPlugin } from './plugins/link-dialog/realmPlugin'

export { toolbarPlugin } from './plugins/toolbar/realmPlugin'
