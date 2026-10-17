import { ElementNode } from 'lexical'
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
  visitNode({ lexicalParent, mdastNode, metaData }) {
    ;(lexicalParent as ElementNode).append(
      $createLexicalJsxNode(
        mdastNode,
        mdastNode.data?.mdxEditorImport ?? (mdastNode.name ? metaData.importDeclarations[mdastNode.name.split('.')[0]] : undefined)
      )
    )
  },
  priority: -200,
  jsxKindReconciliationOwner: true
}
