import { $isRootNode, RootNode as LexicalRootNode } from 'lexical'
import * as Mdast from 'mdast'
import { LexicalExportVisitor } from '../../exportMarkdownFromLexical'

export const LexicalRootVisitor: LexicalExportVisitor<LexicalRootNode, Mdast.Root> = {
  testLexicalNode: $isRootNode,
  visitLexicalNode: ({ actions }) => {
    actions.addAndStepInto('root')
  }
}
