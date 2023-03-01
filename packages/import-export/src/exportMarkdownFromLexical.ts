import {
  $isRootNode,
  $isParagraphNode,
  LexicalNode,
  RootNode as LexicalRootNode,
  ElementNode as LexicalElementNode,
  $isTextNode,
  TextNode,
  ParagraphNode,
  $isElementNode,
} from 'lexical'
import * as Mdast from 'mdast'
import { toMarkdown, Options as ToMarkdownOptions } from 'mdast-util-to-markdown'
import { mdxToMarkdown } from 'mdast-util-mdx'
import { IS_BOLD, IS_CODE, IS_ITALIC, IS_UNDERLINE } from './FormatConstants'
import { $isLinkNode, LinkNode } from '@lexical/link'
import { $isHeadingNode, $isQuoteNode, HeadingNode, QuoteNode } from '@lexical/rich-text'
import { $isListItemNode, $isListNode, ListItemNode, ListNode } from '@lexical/list'
import { HorizontalRuleNode, $isHorizontalRuleNode } from '@lexical/react/LexicalHorizontalRuleNode'
import { $isImageNode, ImageNode } from './nodes/ImageNode'
import { $isFrontmatterNode, FrontmatterNode } from './nodes/FrontmatterNode'
import { $isSandpackNode, SandpackNode } from './nodes/SandpackNode'
import { MdastNode } from './types'
import { frontmatterToMarkdown } from 'mdast-util-frontmatter'
import { directiveToMarkdown } from 'mdast-util-directive'
export type { Options as ToMarkdownOptions } from 'mdast-util-to-markdown'

export interface LexicalVisitActions<T extends LexicalNode> {
  visitChildren(node: T, mdastParent: Mdast.Parent): void
  addAndStepInto(type: string, props?: Record<string, unknown>, hasChildren?: boolean): void
  appendToParent<T extends Mdast.Parent>(parentNode: T, node: T['children'][number]): T['children'][number] | Mdast.Root
}

export interface LexicalNodeVisitParams<T extends LexicalNode> {
  lexicalNode: T
  mdastParent: Mdast.Parent
  actions: LexicalVisitActions<T>
}

export interface LexicalExportVisitor<LN extends LexicalNode, UN extends MdastNode> {
  testLexicalNode?(lexicalNode: LexicalNode): lexicalNode is LN
  visitLexicalNode?(params: LexicalNodeVisitParams<LN>): void

  shouldJoin?(prevNode: Mdast.Content, currentNode: UN): boolean
  join?<T extends Mdast.Content>(prevNode: T, currentNode: T): T
}

export const LexicalRootVisitor: LexicalExportVisitor<LexicalRootNode, Mdast.Content> = {
  testLexicalNode: $isRootNode,
  visitLexicalNode: ({ actions }) => {
    actions.addAndStepInto('root')
  },
}

export const LexicalParagraphVisitor: LexicalExportVisitor<ParagraphNode, Mdast.Paragraph> = {
  testLexicalNode: $isParagraphNode,
  visitLexicalNode: ({ actions }) => {
    actions.addAndStepInto('paragraph')
  },
}

export const LexicalFrontmatterVisitor: LexicalExportVisitor<FrontmatterNode, Mdast.YAML> = {
  testLexicalNode: $isFrontmatterNode,
  visitLexicalNode: ({ actions, lexicalNode }) => {
    actions.addAndStepInto('yaml', { value: lexicalNode.getYaml() })
  },
}

const LexicalLinkVisitor: LexicalExportVisitor<LinkNode, Mdast.Link> = {
  testLexicalNode: $isLinkNode,
  visitLexicalNode: ({ lexicalNode, actions }) => {
    actions.addAndStepInto('link', { url: lexicalNode.getURL() })
  },
}

export const LexicalHeadingVisitor: LexicalExportVisitor<HeadingNode, Mdast.Heading> = {
  testLexicalNode: $isHeadingNode,
  visitLexicalNode: ({ lexicalNode, actions }) => {
    const depth = parseInt(lexicalNode.getTag()[1], 10) as Mdast.Heading['depth']
    actions.addAndStepInto('heading', { depth })
  },
}

export const LexicalListVisitor: LexicalExportVisitor<ListNode, Mdast.List> = {
  testLexicalNode: $isListNode,
  visitLexicalNode: ({ lexicalNode, actions }) => {
    actions.addAndStepInto('list', {
      ordered: lexicalNode.getListType() === 'number',
      //TODO: figure out when spread can be true
      spread: false,
    })
  },
}

export const LexicalListItemVisitor: LexicalExportVisitor<ListItemNode, Mdast.ListItem> = {
  testLexicalNode: $isListItemNode,
  visitLexicalNode: ({ lexicalNode, mdastParent, actions }) => {
    const children = lexicalNode.getChildren()
    const firstChild = children[0]

    if (children.length === 1 && $isListNode(firstChild)) {
      // append the list ater the paragraph of the previous list item
      const prevListItemNode = mdastParent.children.at(-1) as Mdast.ListItem
      actions.visitChildren(lexicalNode, prevListItemNode)
    } else {
      // nest the children in a paragraph for MDAST compatibility
      const listItem = actions.appendToParent(mdastParent, {
        type: 'listItem' as const,
        spread: false,
        children: [{ type: 'paragraph' as const, children: [] }],
      }) as Mdast.ListItem
      actions.visitChildren(lexicalNode, listItem.children[0] as Mdast.Paragraph)
    }
  },
}

export const LexicalQuoteVisitor: LexicalExportVisitor<QuoteNode, Mdast.Blockquote> = {
  testLexicalNode: $isQuoteNode,
  visitLexicalNode: ({ lexicalNode, mdastParent, actions }) => {
    const blockquote = actions.appendToParent(mdastParent, {
      type: 'blockquote' as const,
      children: [{ type: 'paragraph' as const, children: [] }],
    }) as Mdast.Blockquote
    actions.visitChildren(lexicalNode, blockquote.children[0] as Mdast.Paragraph)
  },
}

export const LexicalCodeVisitor: LexicalExportVisitor<SandpackNode, Mdast.Code> = {
  testLexicalNode: $isSandpackNode,
  visitLexicalNode: ({ lexicalNode, actions }) => {
    actions.addAndStepInto('code', {
      value: lexicalNode.getCode(),
    })
  },
}

function isMdastText(mdastNode: Mdast.Content): mdastNode is Mdast.Text {
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
        value: prevNode.value + currentNode.value,
      } as unknown as T
    } else {
      return {
        ...prevNode,
        children: [...(prevNode as unknown as Mdast.Parent).children, ...(currentNode as unknown as Mdast.Parent).children],
      }
    }
  },

  testLexicalNode: $isTextNode,
  visitLexicalNode: ({ lexicalNode, mdastParent, actions }) => {
    const previousSibling = lexicalNode.getPreviousSibling()
    const prevFormat = $isTextNode(previousSibling) ? previousSibling.getFormat() : 0
    const format = lexicalNode.getFormat() ?? 0

    if (format & IS_CODE) {
      actions.addAndStepInto('inlineCode', {
        value: lexicalNode.getTextContent(),
      })
      return
    }

    let localParentNode = mdastParent

    if (prevFormat & format & IS_ITALIC) {
      localParentNode = actions.appendToParent(localParentNode, {
        type: 'emphasis',
        children: [],
      }) as Mdast.Parent
    }
    if (prevFormat & format & IS_BOLD) {
      localParentNode = actions.appendToParent(localParentNode, {
        type: 'strong',
        children: [],
      }) as Mdast.Parent
    }

    if (prevFormat & format & IS_UNDERLINE) {
      localParentNode = actions.appendToParent(localParentNode, {
        type: 'mdxJsxTextElement',
        name: 'u',
        children: [],
        attributes: [],
      }) as Mdast.Parent
    }

    if (format & IS_ITALIC && !(prevFormat & IS_ITALIC)) {
      localParentNode = actions.appendToParent(localParentNode, {
        type: 'emphasis',
        children: [],
      }) as Mdast.Parent
    }

    if (format & IS_BOLD && !(prevFormat & IS_BOLD)) {
      localParentNode = actions.appendToParent(localParentNode, {
        type: 'strong',
        children: [],
      }) as Mdast.Parent
    }

    if (format & IS_UNDERLINE && !(prevFormat & IS_UNDERLINE)) {
      localParentNode = actions.appendToParent(localParentNode, {
        type: 'mdxJsxTextElement',
        name: 'u',
        children: [],
        attributes: [],
      }) as Mdast.Parent
    }

    actions.appendToParent(localParentNode, {
      type: 'text',
      value: lexicalNode.getTextContent(),
    })
  },
}

export const LexicalThematicBreakVisitor: LexicalExportVisitor<HorizontalRuleNode, Mdast.ThematicBreak> = {
  testLexicalNode: $isHorizontalRuleNode,
  visitLexicalNode({ actions }) {
    actions.addAndStepInto('thematicBreak')
  },
}

export const LexicalImageVisitor: LexicalExportVisitor<ImageNode, Mdast.Image> = {
  testLexicalNode: $isImageNode,
  visitLexicalNode({ lexicalNode, actions }) {
    actions.addAndStepInto('image', {
      url: lexicalNode.getSrc(),
      alt: lexicalNode.getAltText(),
      title: lexicalNode.getTitle(),
    })
  },
}

export const LexicalVisitors = [
  LexicalRootVisitor,
  LexicalParagraphVisitor,
  LexicalFrontmatterVisitor,
  LexicalTextVisitor,
  LexicalLinkVisitor,
  LexicalHeadingVisitor,
  LexicalListVisitor,
  LexicalListItemVisitor,
  LexicalQuoteVisitor,
  LexicalCodeVisitor,
  LexicalThematicBreakVisitor,
  LexicalImageVisitor,
]

function isParent(node: unknown): node is Mdast.Parent {
  return (node as { children?: Array<any> }).children instanceof Array
}

function traverseLexicalTree(root: LexicalRootNode, visitors: Array<LexicalExportVisitor<LexicalNode, Mdast.Content>>): Mdast.Root {
  let unistRoot: Mdast.Root | null = null
  visit(root, null)

  function appendToParent<T extends Mdast.Parent, C extends Mdast.Content>(parentNode: T, node: C): C | Mdast.Root {
    if (unistRoot === null) {
      unistRoot = node as unknown as Mdast.Root
      return unistRoot
    }

    if (!isParent(parentNode)) {
      throw new Error('Attempting to append children to a non-parent')
    }

    const siblings = parentNode.children
    const prevSibling = siblings.at(-1)

    if (prevSibling) {
      const joinVisitor = visitors.find((visitor) => visitor.shouldJoin?.(prevSibling, node))
      if (joinVisitor) {
        const joinedNode = joinVisitor.join!(prevSibling, node) as C
        siblings.splice(siblings.length - 1, 1, joinedNode)
        return joinedNode
      }
    }

    siblings.push(node)
    return node
  }

  function visitChildren(lexicalNode: LexicalElementNode, parentNode: Mdast.Parent) {
    lexicalNode.getChildren().forEach((lexicalChild) => {
      visit(lexicalChild, parentNode)
    })
  }

  function visit(lexicalNode: LexicalNode, mdastParent: Mdast.Parent | null) {
    const visitor = visitors.find((visitor) => visitor.testLexicalNode?.(lexicalNode))
    if (!visitor) {
      throw new Error(`no lexical visitor found for ${lexicalNode.getType()}`, {
        cause: lexicalNode,
      })
    }

    visitor.visitLexicalNode?.({
      lexicalNode,
      mdastParent: mdastParent!,
      actions: {
        addAndStepInto(type: string, props = {}, hasChildren = true) {
          const newNode = {
            type,
            ...props,
            ...(hasChildren ? { children: [] } : {}),
          }
          appendToParent(mdastParent!, newNode as unknown as Mdast.Content)
          if ($isElementNode(lexicalNode) && hasChildren) {
            visitChildren(lexicalNode, newNode as Mdast.Parent)
          }
        },
        appendToParent,
        visitChildren,
      },
    })
  }

  if (unistRoot === null) {
    throw new Error('traversal ended with no root element')
  }
  return unistRoot
}

export function exportMarkdownFromLexical(
  root: LexicalRootNode,
  options?: ToMarkdownOptions,
  visitors: Array<LexicalExportVisitor<LexicalNode, Mdast.Content>> = LexicalVisitors
): string {
  return toMarkdown(traverseLexicalTree(root, visitors), {
    extensions: [mdxToMarkdown(), frontmatterToMarkdown('yaml'), directiveToMarkdown],
    listItemIndent: 'one',
    ...options,
  })
}
