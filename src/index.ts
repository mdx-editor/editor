/**
 * The `@mdxeditor/editor` package exports the MDXEditor React component, along with some utilities and default option values that id the customization of the widget.
 * In addition to that, the package exports the LexicalNodes used to represent the MDX AST, as well as the NodeDecorators used to render the nodes in the editor.
 *
 * @packageDocumentation
 */
export type * from './types/JsxComponentDescriptors'
export type { SandpackConfig, SandpackPreset } from './plugins/sandpack/realmPlugin'
export type { MdastTreeImportOptions, MdastVisitActions, MdastVisitParams, MdastImportVisitor } from './import'
export type { ToMarkdownOptions, LexicalVisitActions, LexicalNodeVisitParams, LexicalExportVisitor, LexicalConvertOptions } from './export'
export type { NestedEditorProps } from './ui/NodeDecorators/NestedEditor'
export type { CustomLeafDirectiveEditor, LeafDirectiveEditorProps } from './types/NodeDecoratorsProps'

export * from './nodes'
export * from './ui/MDXEditor'
export { NestedEditor, useMdastNodeUpdater } from './ui/NodeDecorators/NestedEditor'
export { ToolbarComponents } from './ui/ToolbarPlugin/toolbarComponents'
export { MDXEditorCore } from './MDXEditorCore'
