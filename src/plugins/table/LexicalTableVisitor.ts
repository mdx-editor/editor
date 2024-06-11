import * as Mdast from 'mdast'

import { LexicalExportVisitor } from '../../exportMarkdownFromLexical'
import { $isTableNode, TableNode } from './TableEditor'

export const LexicalTableVisitor: LexicalExportVisitor<TableNode, Mdast.Table> = {
  testLexicalNode: $isTableNode,
  visitLexicalNode({ actions, mdastParent, lexicalNode }) {
    actions.appendToParent(mdastParent, lexicalNode.getMdastNode())
  }
}
