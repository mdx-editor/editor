import * as Mdast from 'mdast'
import { LexicalExportVisitor } from '../../exportMarkdownFromLexical'
import { ImageNode, $isImageNode } from './ImageNode'

export const LexicalImageVisitor: LexicalExportVisitor<ImageNode, Mdast.Image> = {
  testLexicalNode: $isImageNode,
  visitLexicalNode({ mdastParent, lexicalNode, actions }) {
    actions.appendToParent(mdastParent, {
      type: 'image',
      url: lexicalNode.getSrc(),
      alt: lexicalNode.getAltText(),
      title: lexicalNode.getTitle()
    })
  }
}
