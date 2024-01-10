import * as Mdast from 'mdast'

import { LexicalExportVisitor } from '@/exportMarkdownFromLexical'
import { $isMarkdownImporterNode, MarkdownImporterNode } from './MarkdownImporterNode'

export const LexicalMarkdownImporterNodeVisitor: LexicalExportVisitor<MarkdownImporterNode, Mdast.RootContent> = {
  testLexicalNode: $isMarkdownImporterNode,
  visitLexicalNode({ actions }) {
    actions.addAndStepInto('root')
  },
  priority: -100
}
