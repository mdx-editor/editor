import { CodeNode } from '@lexical/code'
import { $createLinkNode, LinkNode } from '@lexical/link'
import { $createListItemNode, $createListNode, $isListItemNode, ListItemNode, ListNode } from '@lexical/list'
import { $createHorizontalRuleNode, HorizontalRuleNode } from '@lexical/react/LexicalHorizontalRuleNode'
import { $createHeadingNode, $createQuoteNode, $isQuoteNode, HeadingNode, QuoteNode } from '@lexical/rich-text'
import { $createParagraphNode, $createTextNode, ElementNode, Klass, LexicalNode, RootNode as LexicalRootNode, ParagraphNode } from 'lexical'
import * as Mdast from 'mdast'
import { ContainerDirective, LeafDirective, directiveFromMarkdown } from 'mdast-util-directive'
import { fromMarkdown } from 'mdast-util-from-markdown'
import { FromMarkdownOptions, ParseOptions } from 'mdast-util-from-markdown/lib'
import { frontmatterFromMarkdown } from 'mdast-util-frontmatter'
import { gfmTableFromMarkdown } from 'mdast-util-gfm-table'
import { MdxJsxTextElement, MdxjsEsm, mdxFromMarkdown } from 'mdast-util-mdx'
import { directive } from 'micromark-extension-directive'
import { frontmatter } from 'micromark-extension-frontmatter'
import { gfmTable } from 'micromark-extension-gfm-table'
import { mdxjs } from 'micromark-extension-mdxjs'
import { IS_BOLD, IS_CODE, IS_ITALIC, IS_UNDERLINE } from '../FormatConstants'
import {
  $createAdmonitionNode,
  $createCodeBlockNode,
  $createFrontmatterNode,
  $createImageNode,
  $createJsxNode,
  $createLeafDirectiveNode,
  $createSandpackNode,
  $createTableNode,
  $isAdmonitionNode,
  AdmonitionKind,
  AdmonitionNode,
  CodeBlockNode,
  FrontmatterNode,
  ImageNode,
  JsxNode,
  LeafDirectiveNode,
  SandpackNode,
  TableNode
} from '../nodes'

/**
 * A set of actions that can be used to modify the lexical tree while visiting the mdast tree.
 */
export interface MdastVisitActions {
  /**
   * Iterate the children of the node with the lexical node as the parent.
   */
  visitChildren(node: Mdast.Parent, lexicalParent: LexicalNode): void

  /**
   * Add the given node to the lexical tree, and iterate the current mdast node's children with the newly created lexical node as a parent.
   */
  addAndStepInto(lexicalNode: LexicalNode): void

  /**
   * Adds formatting as a context for the current node and its children.
   * This is necessary due to mdast treating formatting as a node, while lexical considering it an attribute of a node.
   */
  addFormatting(format: typeof IS_BOLD | typeof IS_ITALIC | typeof IS_UNDERLINE): void

  /**
   * Access the current formatting context.
   */
  getParentFormatting(): number
}

/**
 * Parameters passe to the {@link MdastImportVisitor.visitNode} function.
 * @param mdastNode - The node that is currently being visited.
 * @param lexicalParent - The parent lexical node to which the results of the processing should be added.
 * @param actions - A set of convenience utilities that can be used to add nodes to the lexical tree.
 * @typeParam T - The type of the mdast node that is being visited.
 */
export interface MdastVisitParams<T extends Mdast.Content> {
  mdastNode: T
  lexicalParent: LexicalNode
  actions: MdastVisitActions
}

/**
 * Implement this interface to convert certian mdast nodes into lexical nodes.
 * @typeParam UN - The type of the mdast node that is being visited.
 */
export interface MdastImportVisitor<UN extends Mdast.Content> {
  /**
   * The test function that determines if this visitor should be used for the given node.
   * As a convenience, you can also pass a string here, which will be compared to the node's type.
   */
  testNode: ((mdastNode: Mdast.Content | Mdast.Root) => boolean) | string
  /**
   * The function that is called when the node is visited. See {@link MdastVisitParams} for details.
   */
  visitNode(params: MdastVisitParams<UN>): void
}

// the generic should be Mdast.Root, but that doesn't work
export const MdastRootVisitor: MdastImportVisitor<Mdast.Content> = {
  testNode: 'root',
  visitNode({ actions, mdastNode, lexicalParent }) {
    actions.visitChildren(mdastNode as unknown as Mdast.Root, lexicalParent)
  }
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
  }
}

export const MdastLinkVisitor: MdastImportVisitor<Mdast.Link> = {
  testNode: 'link',
  visitNode({ mdastNode, actions }) {
    actions.addAndStepInto(
      $createLinkNode(mdastNode.url, {
        title: mdastNode.title
      })
    )
  }
}

export const MdastAdmonitionVisitor: MdastImportVisitor<ContainerDirective> = {
  testNode: 'containerDirective',
  visitNode({ mdastNode, actions }) {
    actions.addAndStepInto($createAdmonitionNode(mdastNode.name as AdmonitionKind))
  }
}

export const MdastLeafDirectiveVisitor: MdastImportVisitor<LeafDirective> = {
  testNode: 'leafDirective',
  visitNode({ lexicalParent, mdastNode }) {
    ;(lexicalParent as ElementNode).append($createLeafDirectiveNode(mdastNode))
  }
}

export const MdastHeadingVisitor: MdastImportVisitor<Mdast.Heading> = {
  testNode: 'heading',
  visitNode: function ({ mdastNode, actions }): void {
    actions.addAndStepInto($createHeadingNode(`h${mdastNode.depth}`))
  }
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
  }
}

export const MdastListItemVisitor: MdastImportVisitor<Mdast.ListItem> = {
  testNode: 'listItem',
  visitNode({ actions }) {
    actions.addAndStepInto($createListItemNode())
  }
}

export const MdastBlockQuoteVisitor: MdastImportVisitor<Mdast.Blockquote> = {
  testNode: 'blockquote',
  visitNode({ actions }) {
    actions.addAndStepInto($createQuoteNode())
  }
}

export const MdastTableVisitor: MdastImportVisitor<Mdast.Table> = {
  testNode: 'table',
  visitNode({ mdastNode, lexicalParent }) {
    ;(lexicalParent as ElementNode).append($createTableNode(mdastNode))
  }
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
  }
}

export const MdastInlineCodeVisitor: MdastImportVisitor<Mdast.InlineCode> = {
  testNode: 'inlineCode',
  visitNode({ mdastNode, actions }) {
    actions.addAndStepInto($createTextNode(mdastNode.value).setFormat(IS_CODE))
  }
}

export const MdastCodeVisitor: MdastImportVisitor<Mdast.Code> = {
  testNode: 'code',
  visitNode({ mdastNode, actions }) {
    const constructor = mdastNode.meta?.startsWith('live') ? $createSandpackNode : $createCodeBlockNode

    actions.addAndStepInto(
      constructor({
        code: mdastNode.value,
        language: mdastNode.lang!,
        meta: mdastNode.meta!
      })
    )
  }
}

export const MdastTextVisitor: MdastImportVisitor<Mdast.Text> = {
  testNode: 'text',
  visitNode({ mdastNode, actions }) {
    actions.addAndStepInto($createTextNode(mdastNode.value).setFormat(actions.getParentFormatting()))
  }
}

export const MdastThematicBreakVisitor: MdastImportVisitor<Mdast.ThematicBreak> = {
  testNode: 'thematicBreak',
  visitNode({ actions }) {
    actions.addAndStepInto($createHorizontalRuleNode())
  }
}

export const MdastImageVisitor: MdastImportVisitor<Mdast.Image> = {
  testNode: 'image',
  visitNode({ mdastNode, actions }) {
    actions.addAndStepInto(
      $createImageNode({
        src: mdastNode.url,
        altText: mdastNode.alt || '',
        title: mdastNode.title || ''
      })
    )
  }
}

export const MdastFrontmatterVisitor: MdastImportVisitor<Mdast.YAML> = {
  testNode: 'yaml',
  visitNode({ mdastNode, actions }) {
    actions.addAndStepInto($createFrontmatterNode(mdastNode.value))
  }
}

export const MdastMdxJsEsmVisitor: MdastImportVisitor<MdxjsEsm> = {
  testNode: 'mdxjsEsm',
  visitNode() {
    // nothing - we will reconstruct the necessary import statements in the export based on the used elements.
    void 0
  }
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
        //TODO: expressions are not supported yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        attributes: mdastNode.attributes as any,
        updateFn: (lexicalParent) => {
          actions.visitChildren(mdastNode, lexicalParent)
        }
      })
    )
  }
}

export const defaultMdastVisitors: Record<string, MdastImportVisitor<Mdast.Content>> = {
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
  MdastTableVisitor,
  MdastLeafDirectiveVisitor
}

function isParent(node: unknown): node is Mdast.Parent {
  return (node as { children?: Array<any> }).children instanceof Array
}

/**
 * The options of the tree import utility. Not meant to be used directly.
 */
export interface MdastTreeImportOptions {
  root: LexicalRootNode
  visitors: Array<MdastImportVisitor<Mdast.Content>>
  mdastRoot: Mdast.Root
}

export interface MarkdownParseOptions extends Omit<MdastTreeImportOptions, 'mdastRoot'> {
  markdown: string
  syntaxExtensions: NonNullable<ParseOptions['extensions']>
  mdastExtensions: NonNullable<FromMarkdownOptions['mdastExtensions']>
}

/**
 * An extension for the `fromMarkdown` utility tree construction.
 */
export type MdastExtension = MarkdownParseOptions['mdastExtensions'][number]

/**
 * An extension for the `fromMarkdown` utility markdown parse.
 */
export type SyntaxExtension = MarkdownParseOptions['syntaxExtensions'][number]

export const defaultMdastExtensions: Record<string, MdastExtension> = {
  mdxFromMarkdown: mdxFromMarkdown(),
  frontmatterFromMarkdown: frontmatterFromMarkdown('yaml'),
  directiveFromMarkdown: directiveFromMarkdown,
  gfmTableFromMarkdown: gfmTableFromMarkdown
}

export const defaultSyntaxExtensions: Record<string, SyntaxExtension> = {
  mdxjs: mdxjs(),
  frontmatter: frontmatter(),
  directive: directive(),
  gfmTable: gfmTable
}

export function importMarkdownToLexical({ root, markdown, visitors, syntaxExtensions, mdastExtensions }: MarkdownParseOptions): void {
  const mdastRoot = fromMarkdown(markdown, {
    extensions: syntaxExtensions,
    mdastExtensions
  })

  if (mdastRoot.children.length === 0) {
    mdastRoot.children.push({ type: 'paragraph', children: [] })
  }

  importMdastTreeToLexical({ root, mdastRoot, visitors })
}

export function importMdastTreeToLexical({ root, mdastRoot, visitors }: MdastTreeImportOptions): void {
  const formattingMap = new WeakMap<object, number>()

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
      debugger
      throw new Error(`no MdastImportVisitor found for ${mdastNode.type}`, {
        cause: mdastNode
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
        }
      }
    })
  }

  visit(mdastRoot, root, null)
}

/**
 * The default set of lexical nodes used in the editor.
 */
export const defaultLexicalNodes: Record<string, Klass<LexicalNode>> = {
  ParagraphNode,
  LinkNode,
  HeadingNode,
  QuoteNode,
  ListNode,
  ListItemNode,
  HorizontalRuleNode,
  ImageNode,
  SandpackNode,
  CodeBlockNode,
  FrontmatterNode,
  AdmonitionNode,
  JsxNode,
  CodeNode, // this one should not be used, but markdown shortcuts complain about it
  TableNode,
  LeafDirectiveNode
}
