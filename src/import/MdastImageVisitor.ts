import * as Mdast from 'mdast'
import { $createImageNode } from '../nodes'
import { MdastImportVisitor } from './importMarkdownToLexical'

export const MdastImageVisitor: MdastImportVisitor<Mdast.Image> = {
  testNode: 'image',
  visitNode({ mdastNode, actions }) {
    actions.addAndStepInto(
      $createImageNode({
        src: mdastNode.url,
        altText: mdastNode.alt || '',
        title: mdastNode.title || ''
      })
    )
  }
}
