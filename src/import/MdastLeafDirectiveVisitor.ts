import { ElementNode } from 'lexical'
import { LeafDirective } from 'mdast-util-directive'
import { $createLeafDirectiveNode } from '../nodes'
import { MdastImportVisitor } from './importMarkdownToLexical'

export const MdastLeafDirectiveVisitor: MdastImportVisitor<LeafDirective> = {
  testNode: 'leafDirective',
  visitNode({ lexicalParent, mdastNode }) {
    ;(lexicalParent as ElementNode).append($createLeafDirectiveNode(mdastNode))
  }
}
