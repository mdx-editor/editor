import { $createTextNode } from 'lexical'
import * as Mdast from 'mdast'
import { MdastImportVisitor } from '../../importMarkdownToLexical'

export const MdastTextVisitor: MdastImportVisitor<Mdast.Text> = {
  testNode: 'text',
  visitNode({ mdastNode, actions }) {
    const node = $createTextNode(mdastNode.value)
    node.setFormat(actions.getParentFormatting())
    const style = actions.getParentStyle()
    if (style !== '') {
      node.setStyle(style)
    }
    actions.addAndStepInto(node)
  }
}
