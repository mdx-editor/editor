import { $isListItemNode, $isListNode, ListItemNode, ListNode } from '@lexical/list'
import * as Mdast from 'mdast'
import { LexicalExportVisitor } from '../../exportMarkdownFromLexical'
import { $isElementNode, $isTextNode, $isDecoratorNode } from 'lexical'

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
      // nest the children in a paragraph for MDAST compatibility
      const listItem = actions.appendToParent(mdastParent, {
        type: 'listItem' as const,
        checked: parentList.getListType() === 'check' ? Boolean(lexicalNode.getChecked()) : undefined,
        spread: false,
        children: []
      }) as Mdast.ListItem
      let surroundingParagraph: Mdast.Paragraph | null = null
      for (const child of lexicalNode.getChildren()) {
        if ($isTextNode(child) || ($isElementNode(child) && child.isInline()) || ($isDecoratorNode(child) && child.isInline())) {
          if (!surroundingParagraph) {
            surroundingParagraph = actions.appendToParent(listItem, {
              type: 'paragraph' as const,
              children: []
            }) as Mdast.Paragraph
          }
          actions.visit(child, surroundingParagraph)
        } else {
          surroundingParagraph = null
          actions.visit(child, listItem)
        }
      }
    }
  }
}
