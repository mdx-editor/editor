import { $isRootNode, RootNode as LexicalRootNode } from 'lexical'
import * as Mdast from 'mdast'
import { LexicalExportVisitor } from '../../export/exportMarkdownFromLexical'

export const LexicalRootVisitor: LexicalExportVisitor<LexicalRootNode, Mdast.Content> = {
  testLexicalNode: $isRootNode,
  visitLexicalNode: ({ actions }) => {
    actions.addAndStepInto('root')
  }
}
