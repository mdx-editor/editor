import { ElementNode } from 'lexical'
import { Directive } from 'mdast-util-directive'
import { MdastImportVisitor } from '../../importMarkdownToLexical'
import { $createDirectiveNode } from './DirectiveNode'

const DIRECTIVE_TYPES = ['leafDirective', 'containerDirective', 'textDirective']
export const MdastDirectiveVisitor: MdastImportVisitor<Directive> = {
  testNode: (node) => {
    return DIRECTIVE_TYPES.includes(node.type)
  },
  visitNode({ lexicalParent, mdastNode }) {
    ;(lexicalParent as ElementNode).append($createDirectiveNode(mdastNode))
  }
}
