import { $createParagraphNode, ElementNode, RootNode } from 'lexical'
import { MdxJsxTextElement } from 'mdast-util-mdx'
import { $createLexicalJsxNode } from './LexicalJsxNode'
import { MdastImportVisitor } from '../../importMarkdownToLexical'
import { MdxJsxFlowElement } from 'mdast-util-mdx-jsx/lib'

export const MdastMdxJsxElementVisitor: MdastImportVisitor<MdxJsxTextElement | MdxJsxFlowElement> = {
  testNode: (node, { jsxComponentDescriptors }) => {
    if (node.type === 'mdxJsxTextElement' || node.type === 'mdxJsxFlowElement') {
      const descriptor =
        jsxComponentDescriptors.find((descriptor) => descriptor.name === node.name) ??
        jsxComponentDescriptors.find((descriptor) => descriptor.name === '*')
      return descriptor !== undefined
    }
    return false
  },
  visitNode({ lexicalParent, mdastNode, descriptors: { jsxComponentDescriptors } }) {
    const descriptor =
      jsxComponentDescriptors.find((descriptor) => descriptor.name === mdastNode.name) ??
      jsxComponentDescriptors.find((descriptor) => descriptor.name === '*')

    // the parser does not know that the node should be treated as an inline element, but our descriptor does.
    if (descriptor?.kind === 'text' && mdastNode.type === 'mdxJsxFlowElement') {
      const patchedNode = { ...mdastNode, type: 'mdxJsxTextElement' } as MdxJsxTextElement
      const paragraph = $createParagraphNode()
      paragraph.append($createLexicalJsxNode(patchedNode))
      ;(lexicalParent as RootNode).append(paragraph)
    } else {
      ;(lexicalParent as ElementNode).append($createLexicalJsxNode(mdastNode))
    }
  },
  priority: -200
}
