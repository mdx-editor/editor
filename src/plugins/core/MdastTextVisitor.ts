import { $createTextNode } from 'lexical'
import * as Mdast from 'mdast'
import { MdastImportVisitor } from '../../import/importMarkdownToLexical'

export const MdastTextVisitor: MdastImportVisitor<Mdast.Text> = {
  testNode: 'text',
  visitNode({ mdastNode, actions }) {
    actions.addAndStepInto($createTextNode(mdastNode.value).setFormat(actions.getParentFormatting()))
  }
}
