import { ContainerDirective } from 'mdast-util-directive'
import { $createAdmonitionNode, AdmonitionKind } from '../nodes'
import { MdastImportVisitor } from './importMarkdownToLexical'

export const MdastAdmonitionVisitor: MdastImportVisitor<ContainerDirective> = {
  testNode: 'containerDirective',
  visitNode({ mdastNode, actions }) {
    actions.addAndStepInto($createAdmonitionNode(mdastNode.name as AdmonitionKind))
  }
}
