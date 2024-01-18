import * as Mdast from 'mdast'
import { $createCodeBlockNode } from './CodeBlockNode'
import { MdastImportVisitor } from '../../importMarkdownToLexical'

export const MdastCodeVisitor: MdastImportVisitor<Mdast.Code> = {
  testNode: (node, { codeBlockEditorDescriptors }) => {
    if (node.type === 'code') {
      const descriptor = codeBlockEditorDescriptors.find((descriptor) => descriptor.match(node.lang, node.meta))
      return descriptor !== undefined
    }
    return false
  },
  visitNode({ mdastNode, actions }) {
    actions.addAndStepInto(
      $createCodeBlockNode({
        code: mdastNode.value,
        language: mdastNode.lang!,
        meta: mdastNode.meta!
      })
    )
  }
}
