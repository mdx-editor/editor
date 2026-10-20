import { $isListNode, ListNode } from '@lexical/list'
import * as Mdast from 'mdast'
import { LexicalExportVisitor } from '../../exportMarkdownFromLexical'

export const LexicalListVisitor: LexicalExportVisitor<ListNode, Mdast.List> = {
  testLexicalNode: $isListNode,
  visitLexicalNode: ({ lexicalNode, actions }) => {
    const ordered = lexicalNode.getListType() === 'number'
    actions.addAndStepInto('list', {
      ordered,
      ...(ordered ? { start: lexicalNode.getStart() } : {}),
      spread: false
    })
  }
}
