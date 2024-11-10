import * as Mdast from 'mdast'
import { LexicalExportVisitor } from '../../exportMarkdownFromLexical'
import { ImageNode, $isImageNode } from './ImageNode'

export const LexicalImageVisitor: LexicalExportVisitor<ImageNode, Mdast.Image> = {
  testLexicalNode: $isImageNode,
  visitLexicalNode({ mdastParent, lexicalNode, actions }) {
    // if the lexicalNode has height or width different than inherit, append it as an html
    if (lexicalNode.shouldBeSerializedAsElement()) {
      const img = new Image()
      if (lexicalNode.getHeight() !== 'inherit') {
        img.height = lexicalNode.getHeight() as number
      }
      if (lexicalNode.getWidth() !== 'inherit') {
        img.width = lexicalNode.getWidth() as number
      }

      if (lexicalNode.getAltText()) {
        img.alt = lexicalNode.getAltText()
      }

      if (lexicalNode.getTitle()) {
        img.title = lexicalNode.getTitle()!
      }

      for (const attr of lexicalNode.getRest()) {
        if (attr.type === 'mdxJsxAttribute') {
          if (typeof attr.value === 'string') {
            img.setAttribute(attr.name, attr.value)
          }
        }
      }

      actions.appendToParent(mdastParent, {
        type: 'html',
        value: img.outerHTML.replace(/>$/, ` src="${lexicalNode.getSrc()}" />`)
      })
    } else {
      actions.appendToParent(mdastParent, {
        type: 'image',
        url: lexicalNode.getSrc(),
        alt: lexicalNode.getAltText(),
        title: lexicalNode.getTitle()
      })
    }
  }
}
