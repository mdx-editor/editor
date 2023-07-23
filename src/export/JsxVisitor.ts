import type { MdxJsxFlowElement, MdxJsxTextElement } from 'mdast-util-mdx-jsx'
import { $isJsxNode, JsxNode } from '../nodes'
import { LexicalExportVisitor } from './exportMarkdownFromLexical'

export const JsxVisitor: LexicalExportVisitor<JsxNode, MdxJsxFlowElement | MdxJsxTextElement> = {
  testLexicalNode: $isJsxNode,
  visitLexicalNode({ mdastParent, lexicalNode, actions }) {
    const nodeType = lexicalNode.getKind() === 'text' ? 'mdxJsxTextElement' : 'mdxJsxFlowElement'

    actions.registerReferredComponent(lexicalNode.getName())

    const node = {
      type: nodeType,
      name: lexicalNode.getName(),
      attributes: lexicalNode.getAttributes(),
      children: []
    } as MdxJsxFlowElement | MdxJsxTextElement

    actions.appendToParent(mdastParent, node)

    lexicalNode.inNestedEditor(() => {
      actions.visitChildren(lexicalNode, node)
    })
  }
}
