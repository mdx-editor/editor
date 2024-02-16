import { ElementNode } from 'lexical'
import { MdxTextExpression } from 'mdast-util-mdx'
import { MdastImportVisitor } from '../../importMarkdownToLexical'
import { $createLexicalMdxTextExpressionNode } from './LexicalMdxTextExpressionNode'

export const MdastMdxTextExpressionVisitor: MdastImportVisitor<MdxTextExpression> = {
  testNode: 'mdxTextExpression',
  visitNode({ lexicalParent, mdastNode }) {
    ;(lexicalParent as ElementNode).append($createLexicalMdxTextExpressionNode(mdastNode.value))
  },
  priority: -200
}
