import { ElementNode } from 'lexical'
import * as Mdast from 'mdast'
import { $createTableNode } from '../nodes'
import { MdastImportVisitor } from './importMarkdownToLexical'

export const MdastTableVisitor: MdastImportVisitor<Mdast.Table> = {
  testNode: 'table',
  visitNode({ mdastNode, lexicalParent }) {
    ;(lexicalParent as ElementNode).append($createTableNode(mdastNode))
  }
}
