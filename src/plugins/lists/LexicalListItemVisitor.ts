import { $isListItemNode, $isListNode, ListItemNode, ListNode } from '@lexical/list'
import * as Mdast from 'mdast'
import { LexicalExportVisitor } from '../../exportMarkdownFromLexical'

export const LexicalListItemVisitor: LexicalExportVisitor<ListItemNode, Mdast.ListItem> = {
  testLexicalNode: $isListItemNode,
  visitLexicalNode: ({ lexicalNode, mdastParent, actions }) => {
    const children = lexicalNode.getChildren()
    const firstChild = children[0]

    if (children.length === 1 && $isListNode(firstChild)) {
      // append the list after the paragraph of the previous list item
      const prevListItemNode = mdastParent.children.at(-1) as Mdast.ListItem | undefined
      // XXX: this is a hack to avoid errors with deeply nested lists - the approach will flatten them.
      // Deeply nested lists are still not supported, but at least no error will be thrown.
      if (!prevListItemNode) {
        // @ts-expect-error - MDAST type is incorrect
        actions.visitChildren(firstChild, mdastParent)
      } else {
        actions.visitChildren(lexicalNode, prevListItemNode)
      }
    } else {
      const parentList = lexicalNode.getParent()! as ListNode
      const listItem = actions.appendToParent(mdastParent, {
        type: 'listItem' as const,
        checked: parentList.getListType() === 'check' ? Boolean(lexicalNode.getChecked()) : undefined,
        spread: false,
        children: []
      }) as Mdast.ListItem
      actions.visitChildren(lexicalNode, listItem)
    }
  }
}
