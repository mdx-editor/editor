import { $isHeadingNode, HeadingNode } from '@lexical/rich-text'
import * as Mdast from 'mdast'
import { LexicalExportVisitor } from './exportMarkdownFromLexical'

export const LexicalHeadingVisitor: LexicalExportVisitor<HeadingNode, Mdast.Heading> = {
  testLexicalNode: $isHeadingNode,
  visitLexicalNode: ({ lexicalNode, actions }) => {
    const depth = parseInt(lexicalNode.getTag()[1], 10) as Mdast.Heading['depth']
    actions.addAndStepInto('heading', { depth })
  }
}
