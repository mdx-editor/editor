import * as Mdast from 'mdast'
import { $createCodeBlockNode, $createSandpackNode } from '../nodes'
import { MdastImportVisitor } from './importMarkdownToLexical'

export const MdastCodeVisitor: MdastImportVisitor<Mdast.Code> = {
  testNode: 'code',
  visitNode({ mdastNode, actions }) {
    const constructor = mdastNode.meta?.startsWith('live') ? $createSandpackNode : $createCodeBlockNode

    actions.addAndStepInto(
      constructor({
        code: mdastNode.value,
        language: mdastNode.lang!,
        meta: mdastNode.meta!
      })
    )
  }
}
