import { $isTextNode, TextNode } from 'lexical'
import * as Mdast from 'mdast'
import {
  IS_BOLD,
  IS_CODE,
  IS_HIGHLIGHT,
  IS_ITALIC,
  IS_STRIKETHROUGH,
  IS_SUBSCRIPT,
  IS_SUPERSCRIPT,
  IS_UNDERLINE
} from '../../FormatConstants'
import { LexicalExportVisitor } from '../../exportMarkdownFromLexical'
import { type MdxJsxTextElement } from 'mdast-util-mdx-jsx'

export function isMdastText(mdastNode: Mdast.Nodes): mdastNode is Mdast.Text {
  return mdastNode.type === 'text'
}
const JOINABLE_TAGS = ['u', 'span', 'sub', 'sup']

type FormatContainerNode = Mdast.Emphasis | Mdast.Strong | Mdast.Delete | Mdast.Highlight | MdxJsxTextElement

interface FormatContainer {
  format: number
  isTag: boolean
  matches: (node: Mdast.RootContent) => boolean
  create: () => FormatContainerNode
}

function tagFormat(format: number, name: string): FormatContainer {
  return {
    format,
    isTag: true,
    matches: (node) => node.type === 'mdxJsxTextElement' && node.name === name && node.attributes.length === 0,
    create: () => ({ type: 'mdxJsxTextElement', name, children: [], attributes: [] })
  }
}

function markerFormat(format: number, type: 'emphasis' | 'strong' | 'delete' | 'highlight'): FormatContainer {
  return {
    format,
    isTag: false,
    matches: (node) => node.type === type,
    create: () => ({ type, children: [] })
  }
}

// The order breaks ties between formats that start and end on the same text nodes.
const FORMAT_CONTAINERS = [
  tagFormat(IS_UNDERLINE, 'u'),
  tagFormat(IS_SUPERSCRIPT, 'sup'),
  tagFormat(IS_SUBSCRIPT, 'sub'),
  markerFormat(IS_ITALIC, 'emphasis'),
  markerFormat(IS_BOLD, 'strong'),
  markerFormat(IS_STRIKETHROUGH, 'delete'),
  markerFormat(IS_HIGHLIGHT, 'highlight')
]

function countFollowingTextNodesWithFormat(lexicalNode: TextNode, format: number) {
  const style = lexicalNode.getStyle()
  let count = 0
  let sibling = lexicalNode.getNextSibling()
  while ($isTextNode(sibling) && sibling.getFormat() & format && sibling.getStyle() === style) {
    count++
    sibling = sibling.getNextSibling()
  }
  return count
}

export const LexicalTextVisitor: LexicalExportVisitor<TextNode, Mdast.Text | Mdast.Html | MdxJsxTextElement> = {
  shouldJoin: (prevNode, currentNode) => {
    if (['text', 'emphasis', 'strong', 'highlight'].includes(prevNode.type)) {
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

    // Step into the still-open containers of the preceding text directly. Re-appending them relies on joining with the
    // last sibling, which fails when a format that ends here is nested outside of one that continues.
    let continuedFormats = 0
    for (;;) {
      const lastChild = localParentNode.children.at(-1)
      const container =
        lastChild && FORMAT_CONTAINERS.find((c) => format & c.format && !(continuedFormats & c.format) && c.matches(lastChild))
      if (!container) {
        break
      }
      continuedFormats |= container.format
      localParentNode = lastChild as Mdast.Parent
    }

    // A format that runs further must wrap the shorter ones, or it gets split when they end. Tags stay outside of
    // markdown markers, because a marker next to `<` inside a word cannot open or close emphasis (#735).
    const containersToOpen = FORMAT_CONTAINERS.filter((c) => format & c.format && !(continuedFormats & c.format))
      .map((container) => ({ container, runLength: countFollowingTextNodesWithFormat(lexicalNode, container.format) }))
      .sort((a, b) => Number(b.container.isTag) - Number(a.container.isTag) || b.runLength - a.runLength)

    for (const { container } of containersToOpen) {
      localParentNode = actions.appendToParent(localParentNode, container.create()) as Mdast.Parent
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
