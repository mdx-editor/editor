import { $createHeadingNode } from '@lexical/rich-text'
import * as Mdast from 'mdast'
import { MdastImportVisitor } from '../../import'

export const MdastHeadingVisitor: MdastImportVisitor<Mdast.Heading> = {
  testNode: 'heading',
  visitNode: function ({ mdastNode, actions }): void {
    actions.addAndStepInto($createHeadingNode(`h${mdastNode.depth}`))
  }
}
