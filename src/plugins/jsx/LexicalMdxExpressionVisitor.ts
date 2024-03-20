import { MdxFlowExpression, MdxTextExpression } from 'mdast-util-mdx'
import { LexicalExportVisitor } from '../../exportMarkdownFromLexical'
import { $isLexicalMdxExpressionNode, LexicalMdxExpressionNode } from './LexicalMdxExpressionNode'

export const LexicalMdxExpressionVisitor: LexicalExportVisitor<LexicalMdxExpressionNode, MdxTextExpression> = {
  testLexicalNode: $isLexicalMdxExpressionNode,
  visitLexicalNode({ actions, mdastParent, lexicalNode }) {
    const mdastNode = {
      type: lexicalNode.getMdastType(),
      value: lexicalNode.getValue()
    } as const satisfies MdxTextExpression | MdxFlowExpression

    actions.appendToParent(mdastParent, mdastNode)
  }
}
