import * as Mdast from 'mdast'
import { LexicalExportVisitor } from '../../exportMarkdownFromLexical'
import { FrontmatterNode, $isFrontmatterNode } from './FrontmatterNode'

export const LexicalFrontmatterVisitor: LexicalExportVisitor<FrontmatterNode, Mdast.Yaml> = {
  testLexicalNode: $isFrontmatterNode,
  visitLexicalNode: ({ actions, lexicalNode }) => {
    actions.addAndStepInto('yaml', { value: lexicalNode.getYaml() })
  }
}
