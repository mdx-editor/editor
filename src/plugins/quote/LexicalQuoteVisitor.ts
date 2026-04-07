import { $isQuoteNode, QuoteNode } from '@lexical/rich-text'
import * as Mdast from 'mdast'
import { LexicalExportVisitor } from '../../exportMarkdownFromLexical'

export const LexicalQuoteVisitor: LexicalExportVisitor<QuoteNode, Mdast.Blockquote> = {
  testLexicalNode: $isQuoteNode,
  visitLexicalNode: ({ actions }) => {
    actions.addAndStepInto('blockquote')
  }
}
