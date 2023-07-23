import * as Mdast from 'mdast'
import { $isFrontmatterNode, FrontmatterNode } from '../nodes'
import { LexicalExportVisitor } from './exportMarkdownFromLexical'

export const LexicalFrontmatterVisitor: LexicalExportVisitor<FrontmatterNode, Mdast.YAML> = {
  testLexicalNode: $isFrontmatterNode,
  visitLexicalNode: ({ actions, lexicalNode }) => {
    actions.addAndStepInto('yaml', { value: lexicalNode.getYaml() })
  }
}
