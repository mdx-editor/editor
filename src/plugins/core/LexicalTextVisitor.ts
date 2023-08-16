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

export function isMdastText(mdastNode: Mdast.Content): mdastNode is Mdast.Text {
  return mdastNode.type === 'text'
}

export const LexicalTextVisitor: LexicalExportVisitor<TextNode, Mdast.Text> = {
  shouldJoin: (prevNode, currentNode) => {
    return ['text', 'emphasis', 'strong', 'mdxJsxTextElement'].includes(prevNode.type) && prevNode.type === currentNode.type
  },

  join<T extends Mdast.Content>(prevNode: T, currentNode: T) {
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

    if (format & IS_CODE) {
      actions.addAndStepInto('inlineCode', {
        value: textContent
      })
      return
    }

    let localParentNode = mdastParent

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

    const INLINE_TEXT_FORMATTING_JSX_OPTIONS = [
      { format: IS_UNDERLINE, jsxName: 'u' },
      { format: IS_STRIKETHROUGH, jsxName: 's' },
      { format: IS_SUBSCRIPT, jsxName: 'sub' },
      { format: IS_SUPERSCRIPT, jsxName: 'sup' },
      { format: IS_HIGHLIGHT, jsxName: 'mark' }
    ]
    for (const OPTION of INLINE_TEXT_FORMATTING_JSX_OPTIONS) {
      // TODO - Simplify `isFormatMatch` logic statement:
      const isFormatMatch = prevFormat & format & OPTION.format || (!(prevFormat & OPTION.format) && format & OPTION.format)
      if (isFormatMatch) {
        localParentNode = actions.appendToParent(localParentNode, {
          type: 'mdxJsxTextElement',
          name: OPTION.jsxName,
          children: [],
          attributes: []
        }) as Mdast.Parent
      }
    }

    actions.appendToParent(localParentNode, {
      type: 'text',
      value: textContent
    })
  }
}
