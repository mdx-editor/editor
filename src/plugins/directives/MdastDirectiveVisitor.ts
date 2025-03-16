import { $createTextNode, ElementNode } from 'lexical'
import { Directives } from 'mdast-util-directive'
import { MdastImportVisitor } from '../../importMarkdownToLexical'
import { $createDirectiveNode } from './DirectiveNode'
import * as Mdast from 'mdast'

const DIRECTIVE_TYPES = ['leafDirective', 'containerDirective', 'textDirective']

/**
 * Determines if the given node is a HTML MDAST node.
 * @group HTML
 */
export function isMdastDirectivesNode(node: Mdast.Nodes): node is Directives {
  return DIRECTIVE_TYPES.includes(node.type)
}

export const MdastDirectiveVisitor: (escapeUnknownTextDirectives?: boolean) => MdastImportVisitor<Directives> = (
  escapeUnknownTextDirectives
) => ({
  testNode: (node, { directiveDescriptors }) => {
    if (isMdastDirectivesNode(node)) {
      const descriptor = directiveDescriptors.find((descriptor) => descriptor.testNode(node))
      if (escapeUnknownTextDirectives && !descriptor && node.type === 'textDirective') {
        return true
      }
      return descriptor !== undefined
    }
    return false
  },
  visitNode({ lexicalParent, mdastNode, descriptors }) {
    const isKnown = !escapeUnknownTextDirectives || descriptors.directiveDescriptors.some((d) => d.testNode(mdastNode))
    if (isKnown) {
      ;(lexicalParent as ElementNode).append($createDirectiveNode(mdastNode))
    } else {
      /**
       * it is a text-directive and can only occur when `escapeUnknownTextDirectives` is true.
       */
      ;(lexicalParent as ElementNode).append($createTextNode(`:${mdastNode.name}`))
    }
  }
})
