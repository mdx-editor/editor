import { $createListItemNode, ListNode } from '@lexical/list'
import * as Mdast from 'mdast'
import { MdastImportVisitor } from '../../importMarkdownToLexical'

export const MdastListItemVisitor: MdastImportVisitor<Mdast.ListItem> = {
  testNode: 'listItem',
  visitNode({ mdastNode, actions, lexicalParent }) {
    const isChecked = (lexicalParent as ListNode).getListType() === 'check' ? mdastNode.checked ?? false : undefined
    actions.addAndStepInto($createListItemNode(isChecked))
  }
}
