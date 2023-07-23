import * as Mdast from 'mdast'
import { $isImageNode, ImageNode } from '../nodes'
import { LexicalExportVisitor } from './exportMarkdownFromLexical'

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
