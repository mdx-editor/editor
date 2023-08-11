import { LeafDirective } from 'mdast-util-directive'
import { LexicalExportVisitor } from '../../exportMarkdownFromLexical'
import { $isDirectiveNode, DirectiveNode } from './DirectiveNode'

export const DirectiveVisitor: LexicalExportVisitor<DirectiveNode, LeafDirective> = {
  testLexicalNode: $isDirectiveNode,
  visitLexicalNode({ actions, mdastParent, lexicalNode }) {
    actions.appendToParent(mdastParent, lexicalNode.getMdastNode())
  }
}
