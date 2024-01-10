/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { ElementNode, LexicalNode, RootNode as LexicalRootNode } from 'lexical'
import * as Mdast from 'mdast'
import { fromMarkdown, type Options } from 'mdast-util-from-markdown'
import { toMarkdown } from 'mdast-util-to-markdown'
import { ParseOptions } from 'micromark-util-types'
import { IS_BOLD, IS_CODE, IS_ITALIC, IS_UNDERLINE } from './FormatConstants'

/** @internal */
export type MdastExtensions = Options['mdastExtensions']

/**
 * Implement this interface to convert certian mdast nodes into lexical nodes.
 * @typeParam UN - The type of the mdast node that is being visited.
 * @group Markdown Processing
 */
export interface MdastImportVisitor<UN extends Mdast.Nodes> {
  /**
   * The test function that determines if this visitor should be used for the given node.
   * As a convenience, you can also pass a string here, which will be compared to the node's type.
   */
  testNode: ((mdastNode: Mdast.Nodes) => boolean) | string
  visitNode(params: {
    /**
     * The node that is currently being visited.
     */
    mdastNode: UN
    /**
     * The MDAST parent of the node that is currently being visited.
     */
    mdastParent: Mdast.Parent | null
    /**
     * The parent lexical node to which the results of the processing should be added.
     */
    lexicalParent: LexicalNode
    /**
     * A set of convenience utilities that can be used to add nodes to the lexical tree.
     */
    actions: {
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
      addFormatting(format: typeof IS_BOLD | typeof IS_ITALIC | typeof IS_UNDERLINE | typeof IS_CODE, node?: Mdast.RootContent): void

      /**
       * Removes formatting as a context for the current node and its children.
       * This is necessary due to mdast treating formatting as a node, while lexical considering it an attribute of a node.
       */
      removeFormatting(format: typeof IS_BOLD | typeof IS_ITALIC | typeof IS_UNDERLINE | typeof IS_CODE, node?: Mdast.RootContent): void
      /**
       * Access the current formatting context.
       */
      getParentFormatting(): number
    }
  }): void
  /**
   * Default 0, optional, sets the priority of the visitor. The higher the number, the earlier it will be called.
   */
  priority?: number
}

function isParent(node: unknown): node is Mdast.Parent {
  return (node as { children?: any[] }).children instanceof Array
}

/**
 * The options of the tree import utility. Not meant to be used directly.
 * @internal
 */
export interface MdastTreeImportOptions {
  root: LexicalNode
  visitors: MdastImportVisitor<Mdast.RootContent>[]
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

/**
 * An error that gets thrown when the Markdown parsing fails due to a syntax error.
 * @group Markdown Processing
 */
export class MarkdownParseError extends Error {
  constructor(message: string, cause: unknown) {
    super(message)
    this.name = 'MarkdownParseError'
    this.cause = cause
  }
}

/**
 * An error that gets thrown when the Markdown parsing encounters an node that has no corresponding {@link MdastImportVisitor}.
 * @group Markdown Processing
 */
export class UnrecognizedMarkdownConstructError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'UnrecognizedMarkdownConstructError'
  }
}

/** @internal */
export function importMarkdownToLexical({ root, markdown, visitors, syntaxExtensions, mdastExtensions }: MarkdownParseOptions): void {
  let mdastRoot: Mdast.Root
  try {
    mdastRoot = fromMarkdown(markdown, {
      extensions: syntaxExtensions,
      mdastExtensions
    })
  } catch (e: unknown) {
    if (e instanceof Error) {
      throw new MarkdownParseError(`Error parsing markdown: ${e.message}`, e)
    } else {
      throw new MarkdownParseError(`Error parsing markdown: ${e}`, e)
    }
  }

  if (mdastRoot.children.length === 0) {
    mdastRoot.children.push({ type: 'paragraph', children: [] })
  }

  // leave empty paragraph, so that the user can start typing
  if (mdastRoot.children.at(-1)?.type !== 'paragraph') {
    mdastRoot.children.push({ type: 'paragraph', children: [] })
  }

  importMdastTreeToLexical({ root, mdastRoot, visitors })
}

/** @internal */
export function importMdastTreeToLexical({ root, mdastRoot, visitors }: MdastTreeImportOptions): void {
  const formattingMap = new WeakMap<object, number>()

  visitors = visitors.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))

  function visitChildren(mdastNode: Mdast.Parent, lexicalParent: LexicalNode) {
    if (!isParent(mdastNode)) {
      throw new Error('Attempting to visit children of a non-parent')
    }
    mdastNode.children.forEach((child) => visit(child, lexicalParent, mdastNode))
  }

  function visit(mdastNode: Mdast.RootContent | Mdast.Root, lexicalParent: LexicalNode, mdastParent: Mdast.Parent | null) {
    const visitor = visitors.find((visitor) => {
      if (typeof visitor.testNode === 'string') {
        return visitor.testNode === mdastNode.type
      }
      return visitor.testNode(mdastNode)
    })
    if (!visitor) {
      throw new UnrecognizedMarkdownConstructError(`Unsupported markdown syntax: ${toMarkdown(mdastNode)}`)
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
