import { $isParagraphNode, ParagraphNode } from 'lexical'
import * as Mdast from 'mdast'
import { LexicalExportVisitor } from '../../export/exportMarkdownFromLexical'

export const LexicalParagraphVisitor: LexicalExportVisitor<ParagraphNode, Mdast.Paragraph> = {
  testLexicalNode: $isParagraphNode,
  visitLexicalNode: ({ actions }) => {
    actions.addAndStepInto('paragraph')
  }
}
