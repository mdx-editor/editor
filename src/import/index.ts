import { $createCodeNode, CodeHighlightNode, CodeNode } from '@lexical/code'
import { $createLinkNode, LinkNode } from '@lexical/link'
import { $createListItemNode, $createListNode, $isListItemNode, ListItemNode, ListNode } from '@lexical/list'
import { $createHorizontalRuleNode, HorizontalRuleNode } from '@lexical/react/LexicalHorizontalRuleNode'
import { $createHeadingNode, $createQuoteNode, $isQuoteNode, HeadingNode, QuoteNode } from '@lexical/rich-text'
import { $createParagraphNode, $createTextNode, ElementNode, LexicalNode, ParagraphNode, RootNode as LexicalRootNode } from 'lexical'
import * as Mdast from 'mdast'
import { ContainerDirective, directiveFromMarkdown } from 'mdast-util-directive'
import { fromMarkdown } from 'mdast-util-from-markdown'
import { frontmatterFromMarkdown } from 'mdast-util-frontmatter'
import { mdxFromMarkdown, MdxjsEsm, MdxJsxTextElement } from 'mdast-util-mdx'
import { directive } from 'micromark-extension-directive'
import { frontmatter } from 'micromark-extension-frontmatter'
import { mdxjs } from 'micromark-extension-mdxjs'
import { IS_BOLD, IS_CODE, IS_ITALIC, IS_UNDERLINE } from '../FormatConstants'
import {
  $createAdmonitionNode,
  $createFrontmatterNode,
  $createImageNode,
  $createSandpackNode,
  $isAdmonitionNode,
  AdmonitionKind,
  AdmonitionNode,
  FrontmatterNode,
  ImageNode,
  SandpackNode,
} from '../nodes'
import { $createJsxNode, JsxNode } from '../nodes/Jsx'

type MdastNode = Mdast.Content

export interface MdastVisitActions {
  visitChildren(node: Mdast.Parent, lexicalParent: LexicalNode): void

  addAndStepInto(lexicalNode: LexicalNode): void

  addFormatting(format: typeof IS_BOLD | typeof IS_ITALIC | typeof IS_UNDERLINE): void

  getParentFormatting(): number
}

export interface MdastVisitParams<T extends MdastNode> {
  mdastNode: T
  lexicalParent: LexicalNode
  actions: MdastVisitActions
}

export interface MdastImportVisitor<UN extends MdastNode> {
  testNode: ((mdastNode: MdastNode | Mdast.Root) => boolean) | string

  visitNode(params: MdastVisitParams<UN>): void
}

// the generic should be Mdast.Root, but that doesn't work
export const MdastRootVisitor: MdastImportVisitor<Mdast.Content> = {
  testNode: 'root',
  visitNode({ actions, mdastNode, lexicalParent }) {
    actions.visitChildren(mdastNode as unknown as Mdast.Root, lexicalParent)
  },
}

export const MdastParagraphVisitor: MdastImportVisitor<Mdast.Paragraph> = {
  testNode: 'paragraph',
  visitNode: function ({ mdastNode, lexicalParent, actions }): void {
    // markdown inserts paragraphs in lists. lexical does not.
    if ($isListItemNode(lexicalParent) || $isQuoteNode(lexicalParent) || $isAdmonitionNode(lexicalParent)) {
      actions.visitChildren(mdastNode, lexicalParent)
    } else {
      actions.addAndStepInto($createParagraphNode())
    }
  },
}

export const MdastLinkVisitor: MdastImportVisitor<Mdast.Link> = {
  testNode: 'link',
  visitNode({ mdastNode, actions }) {
    actions.addAndStepInto($createLinkNode(mdastNode.url))
  },
}

export const MdastAdmonitionVisitor: MdastImportVisitor<ContainerDirective> = {
  testNode: 'containerDirective',
  visitNode({ mdastNode, actions }) {
    actions.addAndStepInto($createAdmonitionNode(mdastNode.name as AdmonitionKind))
  },
}

export const MdastHeadingVisitor: MdastImportVisitor<Mdast.Heading> = {
  testNode: 'heading',
  visitNode: function ({ mdastNode, actions }): void {
    actions.addAndStepInto($createHeadingNode(`h${mdastNode.depth}`))
  },
}

export const MdastListVisitor: MdastImportVisitor<Mdast.List> = {
  testNode: 'list',
  visitNode: function ({ mdastNode, lexicalParent, actions }): void {
    const lexicalNode = $createListNode(mdastNode.ordered ? 'number' : 'bullet')

    if ($isListItemNode(lexicalParent)) {
      const dedicatedParent = $createListItemNode()
      dedicatedParent.append(lexicalNode)
      lexicalParent.insertAfter(dedicatedParent)
    } else {
      ;(lexicalParent as ElementNode).append(lexicalNode)
    }

    actions.visitChildren(mdastNode, lexicalNode)
  },
}

export const MdastListItemVisitor: MdastImportVisitor<Mdast.ListItem> = {
  testNode: 'listItem',
  visitNode({ actions }) {
    actions.addAndStepInto($createListItemNode())
  },
}

export const MdastBlockQuoteVisitor: MdastImportVisitor<Mdast.Blockquote> = {
  testNode: 'blockquote',
  visitNode({ actions }) {
    actions.addAndStepInto($createQuoteNode())
  },
}

export const MdastFormattingVisitor: MdastImportVisitor<Mdast.Emphasis | Mdast.Strong | MdxJsxTextElement> = {
  testNode(mdastNode) {
    return (
      mdastNode.type === 'emphasis' || mdastNode.type === 'strong' || (mdastNode.type === 'mdxJsxTextElement' && mdastNode?.name === 'u')
    )
  },

  visitNode({ mdastNode, lexicalParent, actions }) {
    if (mdastNode.type === 'emphasis') {
      actions.addFormatting(IS_ITALIC)
    } else if (mdastNode.type === 'strong') {
      actions.addFormatting(IS_BOLD)
    } else if (mdastNode.type === 'mdxJsxTextElement' && mdastNode.name === 'u') {
      actions.addFormatting(IS_UNDERLINE)
    }
    actions.visitChildren(mdastNode, lexicalParent)
  },
}

export const MdastInlineCodeVisitor: MdastImportVisitor<Mdast.InlineCode> = {
  testNode: 'inlineCode',
  visitNode({ mdastNode, actions }) {
    actions.addAndStepInto($createTextNode(mdastNode.value).setFormat(IS_CODE))
  },
}

export const MdastCodeVisitor: MdastImportVisitor<Mdast.Code> = {
  testNode: 'code',
  visitNode({ mdastNode, actions }) {
    if (mdastNode.meta?.startsWith('live')) {
      actions.addAndStepInto(
        $createSandpackNode({
          code: mdastNode.value,
          language: mdastNode.lang!,
          meta: mdastNode.meta,
        })
      )
    } else {
      actions.addAndStepInto($createCodeNode(mdastNode.lang).append($createTextNode(mdastNode.value)))
    }
  },
}

export const MdastTextVisitor: MdastImportVisitor<Mdast.Text> = {
  testNode: 'text',
  visitNode({ mdastNode, actions }) {
    actions.addAndStepInto($createTextNode(mdastNode.value).setFormat(actions.getParentFormatting()))
  },
}

export const MdastThematicBreakVisitor: MdastImportVisitor<Mdast.ThematicBreak> = {
  testNode: 'thematicBreak',
  visitNode({ actions }) {
    actions.addAndStepInto($createHorizontalRuleNode())
  },
}

export const MdastImageVisitor: MdastImportVisitor<Mdast.Image> = {
  testNode: 'image',
  visitNode({ mdastNode, actions }) {
    actions.addAndStepInto(
      $createImageNode({
        src: mdastNode.url,
        altText: mdastNode.alt || '',
        title: mdastNode.title || '',
      })
    )
  },
}

export const MdastFrontmatterVisitor: MdastImportVisitor<Mdast.YAML> = {
  testNode: 'yaml',
  visitNode({ mdastNode, actions }) {
    actions.addAndStepInto(
      $createFrontmatterNode({
        yaml: mdastNode.value,
      })
    )
  },
}

export const MdastMdxJsEsmVisitor: MdastImportVisitor<MdxjsEsm> = {
  testNode: 'mdxjsEsm',
  visitNode() {
    // nothing - we will reconstruct the necessary import statements in the export based on the used elements.
    void 0
  },
}

export const MdastMdxJsxElementVisitor: MdastImportVisitor<MdxJsxTextElement> = {
  testNode: (node) => {
    return node.type === 'mdxJsxTextElement' || node.type === 'mdxJsxFlowElement'
  },
  visitNode({ lexicalParent, mdastNode, actions }) {
    ;(lexicalParent as ElementNode).append(
      $createJsxNode({
        name: mdastNode.name!,
        kind: mdastNode.type === 'mdxJsxTextElement' ? 'text' : 'flow',
        //TODO: expressions are nto supported yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        attributes: mdastNode.attributes as any,
        updateFn: (lexicalParent) => {
          actions.visitChildren(mdastNode, lexicalParent)
        },
      })
    )
  },
}

export const MdastVisitors = [
  MdastRootVisitor,
  MdastParagraphVisitor,
  MdastTextVisitor,
  MdastFormattingVisitor,
  MdastInlineCodeVisitor,
  MdastLinkVisitor,
  MdastHeadingVisitor,
  MdastListVisitor,
  MdastListItemVisitor,
  MdastBlockQuoteVisitor,
  MdastCodeVisitor,
  MdastThematicBreakVisitor,
  MdastImageVisitor,
  MdastFrontmatterVisitor,
  MdastAdmonitionVisitor,
  MdastMdxJsEsmVisitor,
  MdastMdxJsxElementVisitor,
]

function isParent(node: unknown): node is Mdast.Parent {
  return (node as { children?: Array<any> }).children instanceof Array
}

export function importMarkdownToLexical(
  root: LexicalRootNode,
  markdown: string,
  visitors: Array<MdastImportVisitor<Mdast.Content>> = MdastVisitors
): void {
  const formattingMap = new WeakMap<object, number>()

  const tree = fromMarkdown(markdown, {
    extensions: [mdxjs(), frontmatter(), directive()],
    mdastExtensions: [mdxFromMarkdown(), frontmatterFromMarkdown('yaml'), directiveFromMarkdown],
  })

  function visitChildren(mdastNode: Mdast.Parent, lexicalParent: LexicalNode) {
    if (!isParent(mdastNode)) {
      throw new Error('Attempting to visit children of a non-parent')
    }
    mdastNode.children.forEach((child) => visit(child, lexicalParent, mdastNode))
  }

  function visit(mdastNode: Mdast.Content | Mdast.Root, lexicalParent: LexicalNode, mdastParent: Mdast.Parent | null) {
    const visitor = visitors.find((visitor) => {
      if (typeof visitor.testNode === 'string') {
        return visitor.testNode === mdastNode.type
      }
      return visitor.testNode(mdastNode)
    })
    if (!visitor) {
      throw new Error(`no unist visitor found for ${mdastNode.type}`, {
        cause: mdastNode,
      })
    }

    visitor.visitNode({
      //@ts-expect-error root type is glitching
      mdastNode,
      lexicalParent,
      actions: {
        visitChildren,
        addAndStepInto(lexicalNode) {
          ;(lexicalParent as ElementNode).append(lexicalNode)
          if (isParent(mdastNode)) {
            visitChildren(mdastNode, lexicalNode)
          }
        },
        addFormatting(format) {
          formattingMap.set(mdastNode, format | (formattingMap.get(mdastParent!) ?? 0))
        },
        getParentFormatting() {
          return formattingMap.get(mdastParent!) ?? 0
        },
      },
    })
  }

  visit(tree, root, null)
}

export const UsedLexicalNodes = [
  ParagraphNode,
  LinkNode,
  HeadingNode,
  QuoteNode,
  ListNode,
  ListItemNode,
  HorizontalRuleNode,
  ImageNode,
  SandpackNode,
  CodeNode,
  CodeHighlightNode,
  FrontmatterNode,
  AdmonitionNode,
  JsxNode,
]
