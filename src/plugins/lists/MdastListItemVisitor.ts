import { $createListItemNode } from '@lexical/list'
import * as Mdast from 'mdast'
import { MdastImportVisitor } from '../../importMarkdownToLexical'

export const MdastListItemVisitor: MdastImportVisitor<Mdast.ListItem> = {
  testNode: 'listItem',
  visitNode({ mdastNode, actions }) {
    actions.addAndStepInto($createListItemNode(mdastNode.checked ?? undefined))
  }
}
