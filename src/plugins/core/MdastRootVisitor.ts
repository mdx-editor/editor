import * as Mdast from 'mdast'
import { MdastImportVisitor } from '../../importMarkdownToLexical'

// the generic should be Mdast.Root, but that doesn't work
export const MdastRootVisitor: MdastImportVisitor<Mdast.Content> = {
  testNode: 'root',
  visitNode({ actions, mdastNode, lexicalParent }) {
    actions.visitChildren(mdastNode as unknown as Mdast.Root, lexicalParent)
  }
}
