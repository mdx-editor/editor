import * as Mdast from 'mdast'
import { $createCodeBlockNode } from './CodeBlockNode'
import { MdastImportVisitor } from '../../import/importMarkdownToLexical'

export const MdastCodeVisitor: MdastImportVisitor<Mdast.Code> = {
  testNode: 'code',
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
