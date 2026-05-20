import * as Mdast from 'mdast'
import { $createCodeBlockNode } from './CodeBlockNode'
import { MdastImportVisitor } from '../../importMarkdownToLexical'
import { findCodeBlockDescriptor } from './findCodeBlockDescriptor'

export const MdastCodeVisitor: MdastImportVisitor<Mdast.Code> = {
  testNode: (node, { codeBlockEditorDescriptors, defaultCodeBlockLanguage }) => {
    if (node.type === 'code') {
      const descriptor = findCodeBlockDescriptor(codeBlockEditorDescriptors, node.lang, node.meta, defaultCodeBlockLanguage)
      return descriptor !== undefined
    }
    return false
  },
  visitNode({ mdastNode, actions }) {
    actions.addAndStepInto(
      $createCodeBlockNode({
        code: mdastNode.value,
        language: mdastNode.lang ?? '',
        meta: mdastNode.meta ?? ''
      })
    )
  }
}
