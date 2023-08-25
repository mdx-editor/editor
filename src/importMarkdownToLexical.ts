/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { ElementNode, LexicalNode, RootNode as LexicalRootNode } from 'lexical'
import * as Mdast from 'mdast'
import { fromMarkdown } from 'mdast-util-from-markdown'
import { ParseOptions } from 'micromark-util-types'
import { IS_BOLD, IS_CODE, IS_ITALIC, IS_UNDERLINE } from './FormatConstants'

/** @internal */
export type MdastExtensions = NonNullable<Parameters<typeof fromMarkdown>[1]>['mdastExtensions']
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
  addFormatting(format: typeof IS_BOLD | typeof IS_ITALIC | typeof IS_UNDERLINE | typeof IS_CODE, node?: Mdast.Content): void

  /**
   * Adds formatting as a context for the current node and its children.
   * This is necessary due to mdast treating formatting as a node, while lexical considering it an attribute of a node.
   */
  removeFormatting(format: typeof IS_BOLD | typeof IS_ITALIC | typeof IS_UNDERLINE | typeof IS_CODE, node?: Mdast.Content): void
  /**
   * Access the current formatting context.
   */
  getParentFormatting(): number
}

/**
 * Parameters passed to the {@link MdastImportVisitor.visitNode} function.
 * @param mdastNode - The node that is currently being visited.
 * @param lexicalParent - The parent lexical node to which the results of the processing should be added.
 * @param actions - A set of convenience utilities that can be used to add nodes to the lexical tree.
 * @typeParam T - The type of the mdast node that is being visited.
 */
export interface MdastVisitParams<T extends Mdast.Content> {
  mdastNode: T
  mdastParent: Mdast.Parent | null
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

function isParent(node: unknown): node is Mdast.Parent {
  return (node as { children?: any[] }).children instanceof Array
}

/**
 * The options of the tree import utility. Not meant to be used directly.
 * @internal
 */
export interface MdastTreeImportOptions {
  root: LexicalRootNode
  visitors: MdastImportVisitor<Mdast.Content>[]
  mdastRoot: Mdast.Root
}

/** @internal */
export interface MarkdownParseOptions extends Omit<MdastTreeImportOptions, 'mdastRoot'> {
  markdown: string
  syntaxExtensions: NonNullable<ParseOptions['extensions']>
  mdastExtensions: MdastExtensions
}

/**
 * An extension for the `fromMarkdown` utility tree construction.
 * @internal
 */
export type MdastExtension = NonNullable<MdastExtensions>[number]

/**
 * An extension for the `fromMarkdown` utility markdown parse.
 * @internal
 */
export type SyntaxExtension = MarkdownParseOptions['syntaxExtensions'][number]

/** @internal */
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

/** @internal */
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
      throw new Error(`no MdastImportVisitor found for ${mdastNode.type} ${JSON.stringify(mdastNode)}`, {
        cause: mdastNode
      })
    }

    visitor.visitNode({
      //@ts-expect-error root type is glitching
      mdastNode,
      lexicalParent,
      mdastParent,
      actions: {
        visitChildren,
        addAndStepInto(lexicalNode) {
          ;(lexicalParent as ElementNode).append(lexicalNode)
          if (isParent(mdastNode)) {
            visitChildren(mdastNode, lexicalNode)
          }
        },
        addFormatting(format, node = mdastNode as any) {
          formattingMap.set(node, format | (formattingMap.get(mdastParent!) ?? 0))
        },
        removeFormatting(format, node = mdastNode as any) {
          formattingMap.set(node, format ^ (formattingMap.get(mdastParent!) ?? 0))
        },
        getParentFormatting() {
          return formattingMap.get(mdastParent!) ?? 0
        }
      }
    })
  }

  visit(mdastRoot, root, null)
}
