import { $isElementNode, ElementNode as LexicalElementNode, LexicalNode, RootNode as LexicalRootNode } from 'lexical'
import * as Mdast from 'mdast'
import type { MdxjsEsm } from 'mdast-util-mdx'
import { Options as ToMarkdownOptions, toMarkdown } from 'mdast-util-to-markdown'
import type { JsxComponentDescriptor } from './plugins/jsx'

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

/**
 * The "any" type for LexicalExportVisitor.
 * @internal
 */
export type LexicalVisitor = LexicalExportVisitor<LexicalNode, Mdast.Content>

/**
 * @internal
 */
export interface ExportLexicalTreeOptions {
  root: LexicalRootNode
  visitors: LexicalVisitor[]
  jsxComponentDescriptors: JsxComponentDescriptor[]
  jsxIsAvailable: boolean
}

function isParent(node: unknown): node is Mdast.Parent {
  return (node as { children?: any[] }).children instanceof Array
}

/**
 * @internal
 */
export function exportLexicalTreeToMdast({
  root,
  visitors,
  jsxComponentDescriptors,
  jsxIsAvailable
}: ExportLexicalTreeOptions): Mdast.Root {
  let unistRoot: Mdast.Root | null = null
  const referredComponents = new Set<string>()
  visit(root, null)

  function registerReferredComponent(componentName: string) {
    referredComponents.add(componentName)
  }

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
        cause: lexicalNode
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
            ...(hasChildren ? { children: [] } : {})
          }
          appendToParent(mdastParent!, newNode as unknown as Mdast.Content)
          if ($isElementNode(lexicalNode) && hasChildren) {
            visitChildren(lexicalNode, newNode as Mdast.Parent)
          }
        },
        appendToParent,
        visitChildren,
        registerReferredComponent
      }
    })
  }

  if (unistRoot === null) {
    throw new Error('traversal ended with no root element')
  }

  // iterate over all referred components and construct import statements, then append them to the root
  const importsMap = new Map<string, string[]>()
  const defaultImportsMap = new Map<string, string>()

  for (const componentName of referredComponents) {
    const descriptor = jsxComponentDescriptors.find((descriptor) => descriptor.name === componentName)
    if (!descriptor) {
      throw new Error(`Component ${componentName} is used but not imported`)
    }
    if (!descriptor.source) {
      continue
    }
    if (descriptor.defaultExport) {
      defaultImportsMap.set(componentName, descriptor.source)
    } else {
      const { source } = descriptor
      const existing = importsMap.get(source)
      if (existing) {
        existing.push(componentName)
      } else {
        importsMap.set(source, [componentName])
      }
    }
  }

  const imports = Array.from(importsMap).map(([source, componentNames]) => {
    return {
      type: 'mdxjsEsm',
      value: `import { ${componentNames.join(', ')} } from '${source}'`
    } as MdxjsEsm
  })

  imports.push(
    ...Array.from(defaultImportsMap).map(([componentName, source]) => {
      return {
        type: 'mdxjsEsm',
        value: `import ${componentName} from '${source}'`
      } as MdxjsEsm
    })
  )

  const typedRoot = unistRoot as Mdast.Root

  const frontmatter = typedRoot.children.find((child) => child.type === 'yaml')

  if (frontmatter) {
    typedRoot.children.splice(typedRoot.children.indexOf(frontmatter) + 1, 0, ...imports)
  } else {
    typedRoot.children.unshift(...imports)
  }

  fixWrappingWhitespace(typedRoot, [])

  if (!jsxIsAvailable) {
    convertUnderlineJsxToHtml(typedRoot)
  }

  return typedRoot
}

function convertUnderlineJsxToHtml(node: Mdast.Parent | Mdast.Content) {
  if (Object.hasOwn(node, 'children')) {
    const nodeAsParent = node as Mdast.Parent
    const newChildren = [] as Mdast.Content[]
    nodeAsParent.children.forEach((child) => {
      if (child.type === 'mdxJsxTextElement' && child.name === 'u') {
        newChildren.push(...[{ type: 'html', value: '<u>' } as const, ...child.children, { type: 'html', value: '</u>' } as const])
      } else {
        newChildren.push(child)
        convertUnderlineJsxToHtml(child)
      }
    })
    nodeAsParent.children = newChildren
  }
}

const TRAILING_WHITESPACE_REGEXP = /\s+$/
const LEADING_WHITESPACE_REGEXP = /^\s+/
function fixWrappingWhitespace(node: Mdast.Parent | Mdast.Content, parentChain: Mdast.Parent[]) {
  if (node.type === 'strong' || node.type === 'emphasis') {
    const lastChild = node.children.at(-1)
    if (lastChild?.type === 'text') {
      const trailingWhitespace = lastChild.value.match(TRAILING_WHITESPACE_REGEXP)
      if (trailingWhitespace) {
        lastChild.value = lastChild.value.replace(TRAILING_WHITESPACE_REGEXP, '')
        const parent = parentChain.at(-1)
        if (parent) {
          parent.children.splice(parent.children.indexOf(node as unknown as Mdast.Content) + 1, 0, {
            type: 'text',
            value: trailingWhitespace[0]
          })
          fixWrappingWhitespace(parent, parentChain.slice(0, -1))
        }
      }
    }
    const firstChild = node.children.at(0)
    if (firstChild?.type === 'text') {
      const leadingWhitespace = firstChild.value.match(LEADING_WHITESPACE_REGEXP)
      if (leadingWhitespace) {
        firstChild.value = firstChild.value.replace(LEADING_WHITESPACE_REGEXP, '')

        const parent = parentChain.at(-1)
        if (parent) {
          parent.children.splice(parent.children.indexOf(node as unknown as Mdast.Content), 0, {
            type: 'text',
            value: leadingWhitespace[0]
          })
          fixWrappingWhitespace(parent, parentChain.slice(0, -1))
        }
      }
    }
  }
  if (Object.hasOwn(node, 'children')) {
    const nodeAsParent = node as Mdast.Parent
    nodeAsParent.children.forEach((child) => fixWrappingWhitespace(child, [...parentChain, nodeAsParent]))
  }
}

/**
 * @internal
 */
export type ToMarkdownExtension = NonNullable<ToMarkdownOptions['extensions']>[number]

/**
 * @internal
 */
export interface ExportMarkdownFromLexicalOptions extends ExportLexicalTreeOptions {
  visitors: LexicalVisitor[]

  /**
   * the markdown extensions to use
   */
  toMarkdownExtensions: ToMarkdownExtension[]
  /**
   * The options to pass to `toMarkdown`
   */
  toMarkdownOptions: ToMarkdownOptions
}

/**
 * Configures how the lexical tree is converted to a mdast tree and then to markdown.
 */
export interface LexicalConvertOptions {
  /**
   * The visitors to use when processing the lexical tree
   */
  visitors?: LexicalVisitor[]

  /**
   * the markdown extensions to use
   */
  toMarkdownExtensions?: ToMarkdownExtension[]
  /**
   * The options to pass to `toMarkdown`
   */
  toMarkdownOptions?: ToMarkdownOptions
}

/**
 * @internal
 */
export function exportMarkdownFromLexical({
  root,
  toMarkdownOptions,
  toMarkdownExtensions,
  visitors,
  jsxComponentDescriptors,
  jsxIsAvailable
}: ExportMarkdownFromLexicalOptions): string {
  return toMarkdown(exportLexicalTreeToMdast({ root, visitors, jsxComponentDescriptors, jsxIsAvailable }), {
    extensions: toMarkdownExtensions,
    ...toMarkdownOptions
  })
}
