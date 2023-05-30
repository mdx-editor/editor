import { $isLinkNode, LinkNode } from '@lexical/link'
import { $isListItemNode, $isListNode, ListItemNode, ListNode } from '@lexical/list'
import { $isHorizontalRuleNode, HorizontalRuleNode } from '@lexical/react/LexicalHorizontalRuleNode'
import { $isHeadingNode, $isQuoteNode, HeadingNode, QuoteNode } from '@lexical/rich-text'
import {
  $isLineBreakNode,
  $isParagraphNode,
  $isRootNode,
  $isTextNode,
  LexicalNode,
  LineBreakNode,
  ParagraphNode,
  RootNode as LexicalRootNode,
  TextNode,
} from 'lexical'
import * as Mdast from 'mdast'
import { ContainerDirective } from 'mdast-util-directive'
import type { MdxJsxFlowElement, MdxJsxTextElement } from 'mdast-util-mdx-jsx'
import {
  $isAdmonitionNode,
  $isSandpackNode,
  AdmonitionNode,
  SandpackNode,
  JsxNode,
  $isJsxNode,
  $isImageNode,
  ImageNode,
  $isFrontmatterNode,
  FrontmatterNode,
  $isCodeBlockNode,
  CodeBlockNode,
} from '../nodes'

import { IS_BOLD, IS_CODE, IS_ITALIC, IS_UNDERLINE } from '../FormatConstants'
import { $isTableNode, TableNode } from '../nodes/Table'

export type { Options as ToMarkdownOptions } from 'mdast-util-to-markdown'

type MdastNode = Mdast.Content

export interface LexicalVisitActions<T extends LexicalNode> {
  visitChildren(node: T, mdastParent: Mdast.Parent): void
  addAndStepInto(type: string, props?: Record<string, unknown>, hasChildren?: boolean): void
  appendToParent<T extends Mdast.Parent>(parentNode: T, node: T['children'][number]): T['children'][number] | Mdast.Root
  registerReferredComponent(componentName: string): void
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
    actions.addAndStepInto('link', { url: lexicalNode.getURL(), title: lexicalNode.getTitle() })
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
      // append the list after the paragraph of the previous list item
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

export const AdmonitionVisitor: LexicalExportVisitor<AdmonitionNode, ContainerDirective> = {
  testLexicalNode: $isAdmonitionNode,
  visitLexicalNode: ({ lexicalNode, actions }) => {
    actions.addAndStepInto('containerDirective', {
      name: lexicalNode.getKind(),
    })
  },
}

export const SandpackNodeVisitor: LexicalExportVisitor<SandpackNode, Mdast.Code> = {
  testLexicalNode: $isSandpackNode,
  visitLexicalNode: ({ lexicalNode, actions }) => {
    actions.addAndStepInto('code', {
      value: lexicalNode.getCode(),
      lang: lexicalNode.getLanguage(),
      meta: lexicalNode.getMeta(),
    })
  },
}

export const CodeBlockVisitor: LexicalExportVisitor<CodeBlockNode, Mdast.Code> = {
  testLexicalNode: $isCodeBlockNode,
  visitLexicalNode: ({ lexicalNode, actions }) => {
    actions.addAndStepInto('code', {
      value: lexicalNode.getCode(),
      lang: lexicalNode.getLanguage(),
      meta: lexicalNode.getMeta(),
    })
  },
}

function isMdastText(mdastNode: Mdast.Content): mdastNode is Mdast.Text {
  return mdastNode.type === 'text'
}

export const LexicalLinebreakVisitor: LexicalExportVisitor<LineBreakNode, Mdast.Text> = {
  testLexicalNode: $isLineBreakNode,
  visitLexicalNode: ({ mdastParent, actions }) => {
    actions.appendToParent(mdastParent, { type: 'text', value: '\n' })
  },
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
    const textContent = lexicalNode.getTextContent()
    // if the node is only whitespace, ignore the format.
    const format = lexicalNode.getFormat() ?? 0

    if (format & IS_CODE) {
      actions.addAndStepInto('inlineCode', {
        value: textContent,
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
      value: textContent,
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

export const LexicalTableVisitor: LexicalExportVisitor<TableNode, Mdast.Table> = {
  testLexicalNode: $isTableNode,
  visitLexicalNode({ actions, mdastParent, lexicalNode }) {
    actions.appendToParent(mdastParent, lexicalNode.getMdastNode())
  },
}

export const JsxVisitor: LexicalExportVisitor<JsxNode, MdxJsxFlowElement | MdxJsxTextElement> = {
  testLexicalNode: $isJsxNode,
  visitLexicalNode({ mdastParent, lexicalNode, actions }) {
    const nodeType = lexicalNode.getKind() === 'text' ? 'mdxJsxTextElement' : 'mdxJsxFlowElement'

    actions.registerReferredComponent(lexicalNode.getName())

    const node = {
      type: nodeType,
      name: lexicalNode.getName(),
      attributes: lexicalNode.getAttributes(),
      children: [],
    } as MdxJsxFlowElement | MdxJsxTextElement

    actions.appendToParent(mdastParent, node)

    lexicalNode.inNestedEditor(() => {
      actions.visitChildren(lexicalNode, node)
    })
  },
}

export const LexicalVisitors = [
  LexicalRootVisitor,
  LexicalParagraphVisitor,
  LexicalFrontmatterVisitor,
  LexicalTextVisitor,
  LexicalLinebreakVisitor,
  LexicalLinkVisitor,
  LexicalHeadingVisitor,
  LexicalListVisitor,
  LexicalListItemVisitor,
  LexicalQuoteVisitor,
  SandpackNodeVisitor,
  CodeBlockVisitor,
  LexicalThematicBreakVisitor,
  AdmonitionVisitor,
  LexicalImageVisitor,
  JsxVisitor,
  LexicalTableVisitor,
]
