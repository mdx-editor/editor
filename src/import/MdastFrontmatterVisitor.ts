import * as Mdast from 'mdast'
import { $createFrontmatterNode } from '../nodes'
import { MdastImportVisitor } from './importMarkdownToLexical'

export const MdastFrontmatterVisitor: MdastImportVisitor<Mdast.YAML> = {
  testNode: 'yaml',
  visitNode({ mdastNode, actions }) {
    actions.addAndStepInto($createFrontmatterNode(mdastNode.value))
  }
}
