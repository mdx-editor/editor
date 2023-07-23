import { LeafDirective } from 'mdast-util-directive'
import { $isLeafDirectiveNode, LeafDirectiveNode } from '../nodes'
import { LexicalExportVisitor } from './exportMarkdownFromLexical'

export const LexicalLeafDirectiveVisitor: LexicalExportVisitor<LeafDirectiveNode, LeafDirective> = {
  testLexicalNode: $isLeafDirectiveNode,
  visitLexicalNode({ actions, mdastParent, lexicalNode }) {
    actions.appendToParent(mdastParent, lexicalNode.getMdastNode())
  }
}
