import { realmPlugin, system } from '../../gurx'
import { coreSystem } from '../core'
import { QuoteNode } from '@lexical/rich-text'
import { MdastBlockQuoteVisitor } from './MdastBlockQuoteVisitor'
import { LexicalQuoteVisitor } from './LexicalQuoteVisitor'

export const quoteSystem = system(() => {
  return {}
}, [coreSystem])

export const [quotePlugin, quotePluginHooks] = realmPlugin({
  systemSpec: quoteSystem,

  init: (realm) => {
    realm.pubKey('addImportVisitor', MdastBlockQuoteVisitor)
    realm.pubKey('addLexicalNode', QuoteNode)
    realm.pubKey('addExportVisitor', LexicalQuoteVisitor)
  }
})
