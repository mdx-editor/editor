import { $isTextNode, TextNode } from 'lexical'
import * as Mdast from 'mdast'
import { IS_BOLD, IS_CODE, IS_ITALIC, IS_UNDERLINE } from '../../FormatConstants'
import { LexicalExportVisitor } from '../../exportMarkdownFromLexical'
import { type MdxJsxTextElement } from 'mdast-util-mdx-jsx'

export function isMdastText(mdastNode: Mdast.Nodes): mdastNode is Mdast.Text {
  return mdastNode.type === 'text'
}

const JOINABLE_TAGS = ['u', 'span']

export const LexicalTextVisitor: LexicalExportVisitor<TextNode, Mdast.Text> = {
  shouldJoin: (prevNode, currentNode) => {
    if (['text', 'emphasis', 'strong'].includes(prevNode.type)) {
      return prevNode.type === currentNode.type
    }

    if (
      prevNode.type === 'mdxJsxTextElement' &&
      (currentNode as unknown as MdxJsxTextElement).type === 'mdxJsxTextElement' &&
      JOINABLE_TAGS.includes((currentNode as unknown as MdxJsxTextElement).name as string)
    ) {
      const currentMdxNode: MdxJsxTextElement = currentNode as unknown as MdxJsxTextElement
      return prevNode.name === currentMdxNode.name && JSON.stringify(prevNode.attributes) === JSON.stringify(currentMdxNode.attributes)
    }
    return false
  },

  join<T extends Mdast.Nodes>(prevNode: T, currentNode: T) {
    if (isMdastText(prevNode) && isMdastText(currentNode)) {
      return {
        type: 'text',
        value: prevNode.value + currentNode.value
      } as unknown as T
    } else {
      return {
        ...prevNode,
        children: [...(prevNode as unknown as Mdast.Parent).children, ...(currentNode as unknown as Mdast.Parent).children]
      }
    }
  },

  testLexicalNode: $isTextNode,
  visitLexicalNode: ({ lexicalNode, mdastParent, actions }) => {
    const previousSibling = lexicalNode.getPreviousSibling()
    const prevFormat = $isTextNode(previousSibling) ? previousSibling.getFormat() : 0
    const textContent = lexicalNode.getTextContent()
    // if the node is only whitespace, ignore the format.
    const format = lexicalNode.getFormat() ?? 0
    const style = lexicalNode.getStyle()

    let localParentNode = mdastParent

    if (style) {
      localParentNode = actions.appendToParent(localParentNode, {
        type: 'mdxJsxTextElement',
        name: 'span',
        children: [],
        attributes: [{ type: 'mdxJsxAttribute', name: 'style', value: style }]
      }) as Mdast.Parent
    }

    if (prevFormat & format & IS_ITALIC) {
      localParentNode = actions.appendToParent(localParentNode, {
        type: 'emphasis',
        children: []
      }) as Mdast.Parent
    }
    if (prevFormat & format & IS_BOLD) {
      localParentNode = actions.appendToParent(localParentNode, {
        type: 'strong',
        children: []
      }) as Mdast.Parent
    }
    if (prevFormat & format & IS_UNDERLINE) {
      localParentNode = actions.appendToParent(localParentNode, {
        type: 'mdxJsxTextElement',
        name: 'u',
        children: [],
        attributes: []
      }) as Mdast.Parent
    }

    if (format & IS_ITALIC && !(prevFormat & IS_ITALIC)) {
      localParentNode = actions.appendToParent(localParentNode, {
        type: 'emphasis',
        children: []
      }) as Mdast.Parent
    }

    if (format & IS_BOLD && !(prevFormat & IS_BOLD)) {
      localParentNode = actions.appendToParent(localParentNode, {
        type: 'strong',
        children: []
      }) as Mdast.Parent
    }

    if (format & IS_UNDERLINE && !(prevFormat & IS_UNDERLINE)) {
      localParentNode = actions.appendToParent(localParentNode, {
        type: 'mdxJsxTextElement',
        name: 'u',
        children: [],
        attributes: []
      }) as Mdast.Parent
    }

    if (format & IS_CODE) {
      actions.appendToParent(localParentNode, {
        type: 'inlineCode',
        value: textContent
      })
      return
    }

    actions.appendToParent(localParentNode, {
      type: 'text',
      value: textContent
    })
  }
}
