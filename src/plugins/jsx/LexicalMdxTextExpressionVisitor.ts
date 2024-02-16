import { MdxTextExpression } from 'mdast-util-mdx'
import { LexicalExportVisitor } from '../../exportMarkdownFromLexical'
import { $isLexicalMdxTextExpressionNode, LexicalMdxTextExpressionNode } from './LexicalMdxTextExpressionNode'

export const LexicalMdxTextExpressionVisitor: LexicalExportVisitor<LexicalMdxTextExpressionNode, MdxTextExpression> = {
  testLexicalNode: $isLexicalMdxTextExpressionNode,
  visitLexicalNode({ actions, mdastParent, lexicalNode }) {
    const mdastNode: MdxTextExpression = {
      type: 'mdxTextExpression',
      value: lexicalNode.getValue()
    }
    actions.appendToParent(mdastParent, mdastNode)
  }
}
