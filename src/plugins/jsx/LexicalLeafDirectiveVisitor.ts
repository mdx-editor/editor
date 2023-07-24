import { MdxJsxFlowElement, MdxJsxTextElement } from 'mdast-util-mdx-jsx'
import { $isLexicalJsxNode, LexicalJsxNode } from './LexicalJsxNode'
import { LexicalExportVisitor } from '../../export/exportMarkdownFromLexical'

export const LexicalJsxVisitor: LexicalExportVisitor<MdxJsxFlowElement | MdxJsxTextElement, LexicalJsxNode> = {
  testLexicalNode: $isLexicalJsxNode,
  visitLexicalNode({ actions, mdastParent, lexicalNode }) {
    actions.appendToParent(mdastParent, lexicalNode.getMdastNode())
  }
}
