import { $isTextNode, TextNode } from 'lexical'
import * as Mdast from 'mdast'
import { IS_BOLD, IS_CODE, IS_ITALIC, IS_STRIKETHROUGH, IS_SUBSCRIPT, IS_SUPERSCRIPT, IS_UNDERLINE } from '../../FormatConstants'
import { LexicalExportVisitor } from '../../exportMarkdownFromLexical'
import { type MdxJsxTextElement } from 'mdast-util-mdx-jsx'

export function isMdastText(mdastNode: Mdast.Nodes): mdastNode is Mdast.Text {
  return mdastNode.type === 'text'
}

const JOINABLE_TAGS = ['u', 'span', 'sub', 'sup']

export const LexicalTextVisitor: LexicalExportVisitor<TextNode, Mdast.Text | Mdast.Html | MdxJsxTextElement> = {
  shouldJoin: (prevNode, currentNode) => {
    if (['text', 'emphasis', 'strong'].includes(prevNode.type)) {
      return prevNode.type === currentNode.type
    }

    if (
      prevNode.type === 'mdxJsxTextElement' &&
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      currentNode.type === 'mdxJsxTextElement' &&
      JOINABLE_TAGS.includes((currentNode as unknown as MdxJsxTextElement).name!)
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
    const format = lexicalNode.getFormat()
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

    if (prevFormat & format & IS_STRIKETHROUGH) {
      localParentNode = actions.appendToParent(localParentNode, {
        type: 'delete',
        children: []
      }) as Mdast.Parent
    }

    if (prevFormat & format & IS_SUPERSCRIPT) {
      localParentNode = actions.appendToParent(localParentNode, {
        type: 'mdxJsxTextElement',
        name: 'sup',
        children: [],
        attributes: []
      }) as Mdast.Parent
    }

    if (prevFormat & format & IS_SUBSCRIPT) {
      localParentNode = actions.appendToParent(localParentNode, {
        type: 'mdxJsxTextElement',
        name: 'sub',
        children: [],
        attributes: []
      }) as Mdast.Parent
    }

    // repeat the same sequence as above for formatting introduced with this node
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

    if (format & IS_STRIKETHROUGH && !(prevFormat & IS_STRIKETHROUGH)) {
      localParentNode = actions.appendToParent(localParentNode, {
        type: 'delete',
        children: []
      }) as Mdast.Parent
    }

    if (format & IS_SUPERSCRIPT && !(prevFormat & IS_SUPERSCRIPT)) {
      localParentNode = actions.appendToParent(localParentNode, {
        type: 'mdxJsxTextElement',
        name: 'sup',
        children: [],
        attributes: []
      }) as Mdast.Parent
    }

    if (format & IS_SUBSCRIPT && !(prevFormat & IS_SUBSCRIPT)) {
      localParentNode = actions.appendToParent(localParentNode, {
        type: 'mdxJsxTextElement',
        name: 'sub',
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
