import { ElementNode } from 'lexical'
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

export const MdastDirectiveVisitor: MdastImportVisitor<Directives> = {
  testNode: (node, { directiveDescriptors }) => {
    if (isMdastDirectivesNode(node)) {
      const descriptor = directiveDescriptors.find((descriptor) => descriptor.testNode(node))
      return descriptor !== undefined
    }
    return false
  },
  visitNode({ lexicalParent, mdastNode }) {
    ;(lexicalParent as ElementNode).append($createDirectiveNode(mdastNode))
  }
}
