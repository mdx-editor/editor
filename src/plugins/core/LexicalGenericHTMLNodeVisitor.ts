import { MdxJsxFlowElement, MdxJsxTextElement } from 'mdast-util-mdx-jsx'
import { $isGenericHTMLNode, GenericHTMLNode } from './GenericHTMLNode'
import { LexicalExportVisitor } from '../../exportMarkdownFromLexical'

export const LexicalGenericHTMLVisitor: LexicalExportVisitor<GenericHTMLNode, MdxJsxFlowElement | MdxJsxTextElement> = {
  testLexicalNode: $isGenericHTMLNode,
  visitLexicalNode({ actions, lexicalNode }) {
    actions.addAndStepInto('mdxJsxTextElement', {
      name: lexicalNode.getTag(),
      type: lexicalNode.getNodeType(),
      attributes: lexicalNode.getAttributes()
    })
  },
  priority: -100
}
