import * as Mdast from 'mdast'
import { ContainerDirective } from 'mdast-util-directive'
import { $isAdmonitionNode, AdmonitionNode } from '../nodes'
import { LexicalExportVisitor } from './exportMarkdownFromLexical'

export const AdmonitionVisitor: LexicalExportVisitor<AdmonitionNode, ContainerDirective> = {
  testLexicalNode: $isAdmonitionNode,
  visitLexicalNode: ({ mdastParent, lexicalNode, actions }) => {
    const admonition = actions.appendToParent(mdastParent, {
      type: 'containerDirective' as const,
      name: lexicalNode.getKind(),
      children: [{ type: 'paragraph' as const, children: [] }]
    }) as ContainerDirective
    actions.visitChildren(lexicalNode, admonition.children[0] as Mdast.Paragraph)
  }
}
