import { $isQuoteNode, QuoteNode } from '@lexical/rich-text'
import * as Mdast from 'mdast'
import { LexicalExportVisitor } from '../../exportMarkdownFromLexical'

export const LexicalQuoteVisitor: LexicalExportVisitor<QuoteNode, Mdast.Blockquote> = {
  testLexicalNode: $isQuoteNode,
  visitLexicalNode: ({ lexicalNode, mdastParent, actions }) => {
    const paragraph: Mdast.Paragraph = { type: 'paragraph', children: [] }
    actions.appendToParent(mdastParent, { type: 'blockquote', children: [paragraph] })
    actions.visitChildren(lexicalNode, paragraph)
  }
}
