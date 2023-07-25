import { ElementNode } from 'lexical'
import * as Mdast from 'mdast'
import { MdastImportVisitor } from '../../import/importMarkdownToLexical'
import { $createTableNode } from './TableNode'

export const MdastTableVisitor: MdastImportVisitor<Mdast.Table> = {
  testNode: 'table',
  visitNode({ mdastNode, lexicalParent }) {
    ;(lexicalParent as ElementNode).append($createTableNode(mdastNode))
  }
}
