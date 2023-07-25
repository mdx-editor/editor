import { $isQuoteNode, QuoteNode } from '@lexical/rich-text'
import * as Mdast from 'mdast'
import { LexicalExportVisitor } from '../../export'

export const LexicalQuoteVisitor: LexicalExportVisitor<QuoteNode, Mdast.Blockquote> = {
  testLexicalNode: $isQuoteNode,
  visitLexicalNode: ({ lexicalNode, mdastParent, actions }) => {
    const blockquote = actions.appendToParent(mdastParent, {
      type: 'blockquote' as const,
      children: [{ type: 'paragraph' as const, children: [] }]
    }) as Mdast.Blockquote
    actions.visitChildren(lexicalNode, blockquote.children[0] as Mdast.Paragraph)
  }
}
