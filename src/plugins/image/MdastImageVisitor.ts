import * as Mdast from 'mdast'
import { MdastImportVisitor } from '../../import'
import { $createImageNode } from './ImageNode'

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
