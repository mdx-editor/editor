import * as Mdast from 'mdast'
import { $isTableNode, TableNode } from '../nodes'
import { LexicalExportVisitor } from './exportMarkdownFromLexical'

export const LexicalTableVisitor: LexicalExportVisitor<TableNode, Mdast.Table> = {
  testLexicalNode: $isTableNode,
  visitLexicalNode({ actions, mdastParent, lexicalNode }) {
    actions.appendToParent(mdastParent, lexicalNode.getMdastNode())
  }
}
