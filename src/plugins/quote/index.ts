import { realmPlugin, system } from '../../gurx'
import { coreSystem } from '../core'
import { QuoteNode } from '@lexical/rich-text'
import { MdastBlockQuoteVisitor } from './MdastBlockQuoteVisitor'
import { LexicalQuoteVisitor } from './LexicalQuoteVisitor'

export const [
  /** @internal */
  quotePlugin,
  /** @internal */
  quotePluginHooks
] = realmPlugin({
  id: 'quote',
  systemSpec: system(() => {
    return {}
  }, [coreSystem]),

  init: (realm) => {
    realm.pubKey('addImportVisitor', MdastBlockQuoteVisitor)
    realm.pubKey('addLexicalNode', QuoteNode)
    realm.pubKey('addExportVisitor', LexicalQuoteVisitor)
  }
})
