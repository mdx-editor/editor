export * from './ui/MDXEditor'
export type { SandpackConfig, SandpackPreset } from './system/Sandpack'
export type { JsxComponentDescriptors, JsxComponentDescriptor, JsxPropertyDescriptor } from './types/JsxComponentDescriptors'
export type { ViewMode } from './types/ViewMode'
export type { MdastImportVisitor } from './import'
export type { LexicalExportVisitor } from './export'
export { ToolbarComponents } from './ui/ToolbarPlugin/toolbarComponents'

import { defaultLexicalVisitors, defaultExtensions, defaultToMarkdownOptions } from './export'
import { defaultMdastVisitors, defaultSyntaxExtensions, defaultMdastExtensions, defaultLexicalNodes } from './import'

export interface DefaultMdxOptionValues {
  markdownParse: {
    defaultVisitors: typeof defaultMdastVisitors
    defaultSyntaxExtensions: typeof defaultSyntaxExtensions
    defaultMdastExtensions: typeof defaultMdastExtensions
  }
  lexicalConvert: {
    defaultVisitors: typeof defaultLexicalVisitors
    defaultExtensions: typeof defaultExtensions
    defaultMarkdownOptions: typeof defaultToMarkdownOptions
  }
  defaultLexicalNodes: typeof defaultLexicalNodes
}

export const defaultMdxOptionValues: DefaultMdxOptionValues = {
  markdownParse: {
    defaultVisitors: defaultMdastVisitors,
    defaultSyntaxExtensions,
    defaultMdastExtensions,
  },
  lexicalConvert: {
    defaultVisitors: defaultLexicalVisitors,
    defaultExtensions,
    defaultMarkdownOptions: defaultToMarkdownOptions,
  },
  defaultLexicalNodes,
}
