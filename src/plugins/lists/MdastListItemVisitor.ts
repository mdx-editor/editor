import { $createListItemNode } from '@lexical/list'
import * as Mdast from 'mdast'
import { MdastImportVisitor } from '../../import'

export const MdastListItemVisitor: MdastImportVisitor<Mdast.ListItem> = {
  testNode: 'listItem',
  visitNode({ actions }) {
    actions.addAndStepInto($createListItemNode())
  }
}
