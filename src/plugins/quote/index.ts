import { QuoteNode } from '@lexical/rich-text'
import { MdastBlockQuoteVisitor } from './MdastBlockQuoteVisitor'
import { LexicalQuoteVisitor } from './LexicalQuoteVisitor'
import { realmPlugin } from '../../RealmWithPlugins'
import { addActivePlugin$, addImportVisitor$, addLexicalNode$, addExportVisitor$ } from '../core'

/**
 * A plugin that adds support for block quotes to the editor.
 * @group Quote
 */
export const quotePlugin = realmPlugin({
  init(realm) {
    realm.pubIn({
      [addActivePlugin$]: 'quote',
      [addImportVisitor$]: MdastBlockQuoteVisitor,
      [addLexicalNode$]: QuoteNode,
      [addExportVisitor$]: LexicalQuoteVisitor
    })
  }
})
