import { MdxJsxFlowElement, MdxJsxTextElement } from 'mdast-util-mdx-jsx'
import { $isLexicalJsxNode, LexicalJsxNode } from './LexicalJsxNode'
import { LexicalExportVisitor } from '../../export/exportMarkdownFromLexical'

export const LexicalJsxVisitor: LexicalExportVisitor<LexicalJsxNode, MdxJsxFlowElement | MdxJsxTextElement> = {
  testLexicalNode: $isLexicalJsxNode,
  visitLexicalNode({ actions, mdastParent, lexicalNode }) {
    const mdastNode = lexicalNode.getMdastNode()
    actions.registerReferredComponent(mdastNode.name!)
    actions.appendToParent(mdastParent, mdastNode)
  }
}
