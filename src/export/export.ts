import { $isElementNode, ElementNode as LexicalElementNode, LexicalNode, RootNode as LexicalRootNode } from 'lexical'
import * as Mdast from 'mdast'
import { directiveToMarkdown } from 'mdast-util-directive'
import { frontmatterToMarkdown } from 'mdast-util-frontmatter'
import { MdxjsEsm, mdxToMarkdown } from 'mdast-util-mdx'
import { Options as ToMarkdownOptions, toMarkdown } from 'mdast-util-to-markdown'
import { LexicalExportVisitor, LexicalVisitors } from './visitors'
import { JsxComponentDescriptors } from '../system/Jsx'
export type { Options as ToMarkdownOptions } from 'mdast-util-to-markdown'

function isParent(node: unknown): node is Mdast.Parent {
  return (node as { children?: Array<any> }).children instanceof Array
}

function traverseLexicalTree(
  root: LexicalRootNode,
  visitors: Array<LexicalExportVisitor<LexicalNode, Mdast.Content>>,
  jsxComponentDescriptors: JsxComponentDescriptors
): Mdast.Root {
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
        registerReferredComponent,
      },
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
      value: `import { ${componentNames.join(', ')} } from '${source}'`,
    } as MdxjsEsm
  })

  imports.push(
    ...Array.from(defaultImportsMap).map(([componentName, source]) => {
      return {
        type: 'mdxjsEsm',
        value: `import ${componentName} from '${source}'`,
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

  return typedRoot
}

interface ExportMarkdownFromLexicalParams {
  root: LexicalRootNode
  options?: ToMarkdownOptions
  visitors?: Array<LexicalExportVisitor<LexicalNode, Mdast.Content>>
  jsxComponentDescriptors?: JsxComponentDescriptors
}

export function exportMarkdownFromLexical({
  root,
  options,
  visitors = LexicalVisitors,
  jsxComponentDescriptors = [],
}: ExportMarkdownFromLexicalParams): string {
  return toMarkdown(traverseLexicalTree(root, visitors, jsxComponentDescriptors), {
    extensions: [mdxToMarkdown(), frontmatterToMarkdown('yaml'), directiveToMarkdown],
    listItemIndent: 'one',
    ...options,
  })
}
