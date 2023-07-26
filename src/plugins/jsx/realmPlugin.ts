import { mdxFromMarkdown, mdxToMarkdown } from 'mdast-util-mdx'
import { mdxjs } from 'micromark-extension-mdxjs'
import { realmPlugin, system } from '../../gurx'
import { JsxComponentDescriptor } from '../../types/JsxComponentDescriptors'
import { coreSystem } from '../core/realmPlugin'
import { MdastMdxJsxElementVisitor } from './MdastMdxJsxElementVisitor'
import { MdastMdxJsEsmVisitor } from './MdastMdxJsEsmVisitor'
import { LexicalJsxNode } from './LexicalJsxNode'
import { LexicalJsxVisitor } from './LexicalJsxVisitor'

export const jsxSystem = system((_) => ({}), [coreSystem])

export interface JsxPluginParams {
  jsxComponentDescriptors: JsxComponentDescriptor[]
}

export const [jsxPlugin, jsxPluginHooks] = realmPlugin({
  systemSpec: jsxSystem,
  applyParamsToSystem: (realm, params: JsxPluginParams) => {
    realm.pubKey('jsxComponentDescriptors', params?.jsxComponentDescriptors || [])
  },

  init: (realm, _: JsxPluginParams) => {
    realm.pubKey('jsxIsAvailable', true)

    // import
    realm.pubKey('addMdastExtension', mdxFromMarkdown())
    realm.pubKey('addSyntaxExtension', mdxjs())
    realm.pubKey('addImportVisitor', MdastMdxJsxElementVisitor)
    realm.pubKey('addImportVisitor', MdastMdxJsEsmVisitor)

    // export
    realm.pubKey('addLexicalNode', LexicalJsxNode)
    realm.pubKey('addExportVisitor', LexicalJsxVisitor)
    realm.pubKey('addToMarkdownExtension', mdxToMarkdown())
  }
})
