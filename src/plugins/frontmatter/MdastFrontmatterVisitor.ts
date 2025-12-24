import * as Mdast from 'mdast'
import { MdastImportVisitor } from '../../importMarkdownToLexical'
import { $createFrontmatterNode } from './FrontmatterNode'

export const MdastFrontmatterVisitor: MdastImportVisitor<Mdast.Yaml> = {
  testNode: 'yaml',
  visitNode({ mdastNode, actions }) {
    actions.addAndStepInto($createFrontmatterNode(mdastNode.value))
  }
}
