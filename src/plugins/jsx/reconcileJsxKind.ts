import * as Mdast from 'mdast'
import type { MdxJsxFlowElement, MdxJsxTextElement } from 'mdast-util-mdx-jsx'
import type { JsxComponentDescriptor } from '.'

/**
 * Controls how parsed JSX node kinds are reconciled with component descriptors.
 * @group JSX
 */
export type JsxKindMismatchPolicy = 'source' | 'normalize' | 'error'

export class JsxKindMismatchError extends Error {
  constructor(
    node: MdxJsxFlowElement | MdxJsxTextElement,
    descriptor: JsxComponentDescriptor,
    policy: Exclude<JsxKindMismatchPolicy, 'source'>,
    reason?: string
  ) {
    const name = node.name ?? 'Fragment'
    const parsedKind = node.type === 'mdxJsxFlowElement' ? 'flow' : 'text'
    const detail = reason ? ` ${reason}` : ''
    super(
      `JSX component "${name}" was parsed as ${parsedKind} but is declared as ${descriptor.kind} ` +
        `(kindMismatchPolicy: "${policy}").${detail}`
    )
    this.name = 'JsxKindMismatchError'
  }
}

const phrasingParentTypes = new Set([
  'paragraph',
  'heading',
  'emphasis',
  'strong',
  'delete',
  'link',
  'linkReference',
  'tableCell',
  'footnote',
  'mdxJsxTextElement',
  'textDirective',
  'leafDirective'
])

const flowParentTypes = new Set(['root', 'blockquote', 'listItem', 'footnoteDefinition', 'mdxJsxFlowElement', 'containerDirective'])

function isJsxNode(node: Mdast.Nodes): node is MdxJsxFlowElement | MdxJsxTextElement {
  return node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement'
}

function findDescriptor(node: MdxJsxFlowElement | MdxJsxTextElement, descriptors: JsxComponentDescriptor[]) {
  return descriptors.find((descriptor) => descriptor.name === node.name) ?? descriptors.find((descriptor) => descriptor.name === '*')
}

function isMismatch(node: MdxJsxFlowElement | MdxJsxTextElement, descriptor: JsxComponentDescriptor) {
  return (node.type === 'mdxJsxFlowElement' ? 'flow' : 'text') !== descriptor.kind
}

function assertNoMismatches(
  node: Mdast.Nodes,
  descriptors: JsxComponentDescriptor[],
  shouldReconcile: (node: MdxJsxFlowElement | MdxJsxTextElement) => boolean
) {
  if (isJsxNode(node)) {
    const descriptor = findDescriptor(node, descriptors)
    if (descriptor && shouldReconcile(node) && isMismatch(node, descriptor)) {
      throw new JsxKindMismatchError(node, descriptor, 'error')
    }
  }

  if ('children' in node) {
    node.children.forEach((child) => {
      assertNoMismatches(child, descriptors, shouldReconcile)
    })
  }
}

function normalizeTree(
  root: Mdast.Root,
  descriptors: JsxComponentDescriptor[],
  shouldReconcile: (node: MdxJsxFlowElement | MdxJsxTextElement) => boolean
) {
  const findOwnedDescriptor = (node: MdxJsxFlowElement | MdxJsxTextElement) =>
    shouldReconcile(node) ? findDescriptor(node, descriptors) : undefined

  function normalizeParent<T extends Mdast.Parent>(node: T): T {
    const context = phrasingParentTypes.has(node.type) ? 'phrasing' : flowParentTypes.has(node.type) ? 'flow' : 'structural'

    if (context === 'phrasing') {
      node.children = node.children.flatMap((child) => normalizePhrasingChild(child, node.type)) as T['children']
    } else if (context === 'flow') {
      node.children = node.children.flatMap((child) => normalizeFlowChild(child)) as T['children']
    } else {
      node.children = node.children.map((child) => normalizeStructuralChild(child, node.type)) as T['children']
    }

    return node
  }

  function normalizeDescendants<T extends Mdast.Nodes>(node: T): T {
    if ('children' in node) {
      normalizeParent(node)
    }
    return node
  }

  function normalizeStructuralChild<T extends Mdast.Nodes>(node: T, parentType: string): T {
    if (isJsxNode(node)) {
      const descriptor = findOwnedDescriptor(node)
      if (descriptor && isMismatch(node, descriptor)) {
        throw new JsxKindMismatchError(
          node,
          descriptor,
          'normalize',
          `The ${parentType} parent does not declare whether its children are flow or phrasing content.`
        )
      }
    }
    return normalizeDescendants(node)
  }

  function normalizePhrasingChild(node: Mdast.Nodes, parentType: string): Mdast.Nodes[] {
    if (!isJsxNode(node)) {
      return [normalizeDescendants(node)]
    }

    const descriptor = findOwnedDescriptor(node)
    if (!descriptor || !isMismatch(node, descriptor)) {
      return [normalizeDescendants(node)]
    }

    if (node.type === 'mdxJsxTextElement') {
      throw new JsxKindMismatchError(
        node,
        descriptor,
        'normalize',
        `It cannot be lifted from ${parentType} without changing surrounding phrasing content.`
      )
    }

    const textNode = convertFlowToText(node, descriptor)
    return [normalizeDescendants(textNode)]
  }

  function normalizeParagraph(node: Mdast.Paragraph): Mdast.RootContent[] {
    const flowMismatch = node.children.find((child) => {
      if (child.type !== 'mdxJsxTextElement') {
        return false
      }
      const descriptor = findOwnedDescriptor(child)
      return descriptor?.kind === 'flow'
    }) as MdxJsxTextElement | undefined

    if (!flowMismatch) {
      return [normalizeParent(node)]
    }

    const descriptor = findOwnedDescriptor(flowMismatch)!
    if (node.children.length !== 1) {
      throw new JsxKindMismatchError(
        flowMismatch,
        descriptor,
        'normalize',
        'It has surrounding phrasing content, and normalization would need to split the paragraph.'
      )
    }

    const flowNode: MdxJsxFlowElement = {
      ...flowMismatch,
      type: 'mdxJsxFlowElement',
      children: flowMismatch.children.length === 0 ? [] : [{ type: 'paragraph', children: flowMismatch.children }]
    }
    return [normalizeDescendants(flowNode)]
  }

  function normalizeFlowChild(node: Mdast.Nodes): Mdast.Nodes[] {
    if (node.type === 'paragraph') {
      return normalizeParagraph(node)
    }

    if (!isJsxNode(node)) {
      return [normalizeDescendants(node)]
    }

    const descriptor = findOwnedDescriptor(node)
    if (!descriptor || !isMismatch(node, descriptor)) {
      return [normalizeDescendants(node)]
    }

    if (node.type === 'mdxJsxTextElement') {
      throw new JsxKindMismatchError(
        node,
        descriptor,
        'normalize',
        'A text JSX node can be normalized to flow only when it is the sole child of a paragraph.'
      )
    }

    const textNode = normalizeDescendants(convertFlowToText(node, descriptor))
    return [{ type: 'paragraph', children: [textNode] }]
  }

  function convertFlowToText(node: MdxJsxFlowElement, descriptor: JsxComponentDescriptor): MdxJsxTextElement {
    if (node.children.length === 0) {
      return { ...node, type: 'mdxJsxTextElement', children: [] }
    }

    if (node.children.length !== 1 || node.children[0].type !== 'paragraph') {
      throw new JsxKindMismatchError(
        node,
        descriptor,
        'normalize',
        'Its block children cannot be represented as one phrasing-content sequence without data loss.'
      )
    }

    return { ...node, type: 'mdxJsxTextElement', children: node.children[0].children }
  }

  return normalizeParent(root)
}

export function reconcileJsxKindMismatches(
  root: Mdast.Root,
  descriptors: JsxComponentDescriptor[],
  policy: JsxKindMismatchPolicy,
  shouldReconcile: (node: MdxJsxFlowElement | MdxJsxTextElement) => boolean = () => true
): Mdast.Root {
  if (policy === 'source') {
    return root
  }

  if (policy === 'error') {
    assertNoMismatches(root, descriptors, shouldReconcile)
    return root
  }

  return normalizeTree(structuredClone(root), descriptors, shouldReconcile)
}
