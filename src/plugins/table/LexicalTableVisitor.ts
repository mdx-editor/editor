import * as Mdast from 'mdast'
import { LexicalExportVisitor } from '../../export'
import { TableNode, $isTableNode } from './TableNode'

export const LexicalTableVisitor: LexicalExportVisitor<TableNode, Mdast.Table> = {
  testLexicalNode: $isTableNode,
  visitLexicalNode({ actions, mdastParent, lexicalNode }) {
    actions.appendToParent(mdastParent, lexicalNode.getMdastNode())
  }
}
