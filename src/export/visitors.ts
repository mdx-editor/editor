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
  RootNode as LexicalRootNode,
  LineBreakNode,
  ParagraphNode,
  TextNode
} from 'lexical'
import * as Mdast from 'mdast'
import { ContainerDirective, LeafDirective } from 'mdast-util-directive'
import type { MdxJsxFlowElement, MdxJsxTextElement } from 'mdast-util-mdx-jsx'
import {
  $isAdmonitionNode,
  $isCodeBlockNode,
  $isFrontmatterNode,
  $isImageNode,
  $isJsxNode,
  $isLeafDirectiveNode,
  $isSandpackNode,
  $isTableNode,
  AdmonitionNode,
  CodeBlockNode,
  FrontmatterNode,
  ImageNode,
  JsxNode,
  LeafDirectiveNode,
  SandpackNode,
  TableNode
} from '../nodes'

import { IS_BOLD, IS_CODE, IS_ITALIC, IS_UNDERLINE } from '../FormatConstants'

export type { Options as ToMarkdownOptions } from 'mdast-util-to-markdown'

/**
 * A set of covenience utilities to manipulate the mdast tree when processing lexical nodes.
 */
export interface LexicalVisitActions<T extends LexicalNode> {
  /**
   * Iterate over the immediate children of a lexical node with the given mdast node as a parent.
   */
  visitChildren(node: T, mdastParent: Mdast.Parent): void
  /**
   * Create a new mdast node with the given type, and props.
   * Iterate over the immediate children of the current lexical node with the new mdast node as a parent.
   * @param hasChildren - true by default. Pass false to skip iterating over the lexical node children.
   */
  addAndStepInto(type: string, props?: Record<string, unknown>, hasChildren?: boolean): void
  /**
   * Append a new mdast node to a parent node.
   * @param parentNode - the mdast parent node to append the new node to.
   * @param node - the mdast node to append.
   */
  appendToParent<T extends Mdast.Parent>(parentNode: T, node: T['children'][number]): T['children'][number] | Mdast.Root
  /**
   * Used when processing JSX nodes so that later, the correct import statement can be added to the document.
   * @param componentName - the name of the component that has to be imported.
   * @see {@link JsxComponentDescriptor}
   */
  registerReferredComponent(componentName: string): void
}

/**
 * The params passed to the {@link LexicalExportVisitor.visitLexicalNode} method.
 */
export interface LexicalNodeVisitParams<T extends LexicalNode> {
  /**
   * The lexical node that is being visited.
   */
  lexicalNode: T
  /**
   * The mdast parent node that the result of the lexical node conversion should be appended to.
   */
  mdastParent: Mdast.Parent
  /**
   * A set of actions that can be used to manipulate the mdast tree.
   * These are "convenience" utilities that avoid the repetitive boilerplate of creating mdast nodes.
   */
  actions: LexicalVisitActions<T>
}

/**
 * Implement this interface in order to process mdast node(s) into a lexical tree.
 * This is part of the process that converts the editor contents to markdown.
 */
export interface LexicalExportVisitor<LN extends LexicalNode, UN extends Mdast.Content> {
  /**
   * Return true if the given node is of the type that this visitor can process.
   * You can safely use the node type guard functions (as in $isParagraphNode, $isLinkNode, etc.) here.
   */
  testLexicalNode?(lexicalNode: LexicalNode): lexicalNode is LN
  /**
   * Process the given node and manipulate the mdast tree accordingly.
   * @see {@link LexicalNodeVisitParams} and {@link LexicalVisitActions} for more information.
   */
  visitLexicalNode?(params: LexicalNodeVisitParams<LN>): void

  /**
   * Return true if the current node should be joined with the previous node.
   * This is necessary due to some inconsistencies between the lexical tree and the mdast tree when it comes to formatting.
   */
  shouldJoin?(prevNode: Mdast.Content, currentNode: UN): boolean

  /**
   * Join the current node with the previous node, returning the resulting new node
   * For this to be called by the tree walk, shouldJoin must return true.
   */
  join?<T extends Mdast.Content>(prevNode: T, currentNode: T): T
}

const LexicalRootVisitor: LexicalExportVisitor<LexicalRootNode, Mdast.Content> = {
  testLexicalNode: $isRootNode,
  visitLexicalNode: ({ actions }) => {
    actions.addAndStepInto('root')
  }
}

const LexicalParagraphVisitor: LexicalExportVisitor<ParagraphNode, Mdast.Paragraph> = {
  testLexicalNode: $isParagraphNode,
  visitLexicalNode: ({ actions }) => {
    actions.addAndStepInto('paragraph')
  }
}

const LexicalFrontmatterVisitor: LexicalExportVisitor<FrontmatterNode, Mdast.YAML> = {
  testLexicalNode: $isFrontmatterNode,
  visitLexicalNode: ({ actions, lexicalNode }) => {
    actions.addAndStepInto('yaml', { value: lexicalNode.getYaml() })
  }
}

const LexicalLinkVisitor: LexicalExportVisitor<LinkNode, Mdast.Link> = {
  testLexicalNode: $isLinkNode,
  visitLexicalNode: ({ lexicalNode, actions }) => {
    actions.addAndStepInto('link', { url: lexicalNode.getURL(), title: lexicalNode.getTitle() })
  }
}

const LexicalHeadingVisitor: LexicalExportVisitor<HeadingNode, Mdast.Heading> = {
  testLexicalNode: $isHeadingNode,
  visitLexicalNode: ({ lexicalNode, actions }) => {
    const depth = parseInt(lexicalNode.getTag()[1], 10) as Mdast.Heading['depth']
    actions.addAndStepInto('heading', { depth })
  }
}

const LexicalListVisitor: LexicalExportVisitor<ListNode, Mdast.List> = {
  testLexicalNode: $isListNode,
  visitLexicalNode: ({ lexicalNode, actions }) => {
    actions.addAndStepInto('list', {
      ordered: lexicalNode.getListType() === 'number',
      //TODO: figure out when spread can be true
      spread: false
    })
  }
}

const LexicalListItemVisitor: LexicalExportVisitor<ListItemNode, Mdast.ListItem> = {
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
        children: [{ type: 'paragraph' as const, children: [] }]
      }) as Mdast.ListItem
      actions.visitChildren(lexicalNode, listItem.children[0] as Mdast.Paragraph)
    }
  }
}

const LexicalQuoteVisitor: LexicalExportVisitor<QuoteNode, Mdast.Blockquote> = {
  testLexicalNode: $isQuoteNode,
  visitLexicalNode: ({ lexicalNode, mdastParent, actions }) => {
    const blockquote = actions.appendToParent(mdastParent, {
      type: 'blockquote' as const,
      children: [{ type: 'paragraph' as const, children: [] }]
    }) as Mdast.Blockquote
    actions.visitChildren(lexicalNode, blockquote.children[0] as Mdast.Paragraph)
  }
}

const AdmonitionVisitor: LexicalExportVisitor<AdmonitionNode, ContainerDirective> = {
  testLexicalNode: $isAdmonitionNode,
  visitLexicalNode: ({ mdastParent, lexicalNode, actions }) => {
    const admonition = actions.appendToParent(mdastParent, {
      type: 'containerDirective' as const,
      name: lexicalNode.getKind(),
      children: [{ type: 'paragraph' as const, children: [] }]
    }) as ContainerDirective
    actions.visitChildren(lexicalNode, admonition.children[0] as Mdast.Paragraph)
  }
}

const SandpackNodeVisitor: LexicalExportVisitor<SandpackNode, Mdast.Code> = {
  testLexicalNode: $isSandpackNode,
  visitLexicalNode: ({ lexicalNode, actions }) => {
    actions.addAndStepInto('code', {
      value: lexicalNode.getCode(),
      lang: lexicalNode.getLanguage(),
      meta: lexicalNode.getMeta()
    })
  }
}

const CodeBlockVisitor: LexicalExportVisitor<CodeBlockNode, Mdast.Code> = {
  testLexicalNode: $isCodeBlockNode,
  visitLexicalNode: ({ lexicalNode, actions }) => {
    actions.addAndStepInto('code', {
      value: lexicalNode.getCode(),
      lang: lexicalNode.getLanguage(),
      meta: lexicalNode.getMeta()
    })
  }
}

function isMdastText(mdastNode: Mdast.Content): mdastNode is Mdast.Text {
  return mdastNode.type === 'text'
}

const LexicalLinebreakVisitor: LexicalExportVisitor<LineBreakNode, Mdast.Text> = {
  testLexicalNode: $isLineBreakNode,
  visitLexicalNode: ({ mdastParent, actions }) => {
    actions.appendToParent(mdastParent, { type: 'text', value: '\n' })
  }
}

const LexicalTextVisitor: LexicalExportVisitor<TextNode, Mdast.Text> = {
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

    actions.appendToParent(localParentNode, {
      type: 'text',
      value: textContent
    })
  }
}

const LexicalThematicBreakVisitor: LexicalExportVisitor<HorizontalRuleNode, Mdast.ThematicBreak> = {
  testLexicalNode: $isHorizontalRuleNode,
  visitLexicalNode({ actions }) {
    actions.addAndStepInto('thematicBreak')
  }
}

const LexicalImageVisitor: LexicalExportVisitor<ImageNode, Mdast.Image> = {
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

const LexicalTableVisitor: LexicalExportVisitor<TableNode, Mdast.Table> = {
  testLexicalNode: $isTableNode,
  visitLexicalNode({ actions, mdastParent, lexicalNode }) {
    actions.appendToParent(mdastParent, lexicalNode.getMdastNode())
  }
}

const LexicalLeafDirectiveVisitor: LexicalExportVisitor<LeafDirectiveNode, LeafDirective> = {
  testLexicalNode: $isLeafDirectiveNode,
  visitLexicalNode({ actions, mdastParent, lexicalNode }) {
    actions.appendToParent(mdastParent, lexicalNode.getMdastNode())
  }
}

const JsxVisitor: LexicalExportVisitor<JsxNode, MdxJsxFlowElement | MdxJsxTextElement> = {
  testLexicalNode: $isJsxNode,
  visitLexicalNode({ mdastParent, lexicalNode, actions }) {
    const nodeType = lexicalNode.getKind() === 'text' ? 'mdxJsxTextElement' : 'mdxJsxFlowElement'

    actions.registerReferredComponent(lexicalNode.getName())

    const node = {
      type: nodeType,
      name: lexicalNode.getName(),
      attributes: lexicalNode.getAttributes(),
      children: []
    } as MdxJsxFlowElement | MdxJsxTextElement

    actions.appendToParent(mdastParent, node)

    lexicalNode.inNestedEditor(() => {
      actions.visitChildren(lexicalNode, node)
    })
  }
}

export const defaultLexicalVisitors = {
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
  LexicalLeafDirectiveVisitor
}
