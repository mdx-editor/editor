import { $isLinkNode, LinkNode } from '@lexical/link'
import * as Mdast from 'mdast'
import { LexicalExportVisitor } from './exportMarkdownFromLexical'

export const LexicalLinkVisitor: LexicalExportVisitor<LinkNode, Mdast.Link> = {
  testLexicalNode: $isLinkNode,
  visitLexicalNode: ({ lexicalNode, actions }) => {
    actions.addAndStepInto('link', { url: lexicalNode.getURL(), title: lexicalNode.getTitle() })
  }
}
