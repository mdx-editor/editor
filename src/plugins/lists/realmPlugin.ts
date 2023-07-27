import { realmPlugin, system } from '../../gurx'
import { coreSystem } from '../core/realmPlugin'
import { MdastListVisitor } from './MdastListVisitor'
import { MdastListItemVisitor } from './MdastListItemVisitor'
import { LexicalListVisitor } from './LexicalListVisitor'
import { LexicalListItemVisitor } from './LexicalListItemVisitor'
import { ListItemNode, ListNode } from '@lexical/list'
import type { RangeSelection } from 'lexical'
import { $getListDepth, $isListItemNode, $isListNode } from '@lexical/list'
import { $getSelection, $isElementNode, $isRangeSelection, COMMAND_PRIORITY_CRITICAL, ElementNode, INDENT_CONTENT_COMMAND } from 'lexical'
import { TabIndentationPlugin } from '@lexical/react/LexicalTabIndentationPlugin'
import { ListPlugin } from '@lexical/react/LexicalListPlugin'

export const listsSystem = system((_) => ({}), [coreSystem])

export const [listsPlugin] = realmPlugin({
  systemSpec: listsSystem,

  init: (realm) => {
    realm.pubKey('addImportVisitor', MdastListVisitor)
    realm.pubKey('addImportVisitor', MdastListItemVisitor)
    realm.pubKey('addLexicalNode', ListItemNode)
    realm.pubKey('addLexicalNode', ListNode)
    realm.pubKey('addExportVisitor', LexicalListVisitor)
    realm.pubKey('addExportVisitor', LexicalListItemVisitor)

    realm.getKeyValue('rootEditor')?.registerCommand(INDENT_CONTENT_COMMAND, () => !isIndentPermitted(7), COMMAND_PRIORITY_CRITICAL)
    realm.pubKey('addComposerChild', TabIndentationPlugin)
    realm.pubKey('addComposerChild', ListPlugin)
  }
})

// Taken from the list indent plugin of the Lexical playground
function getElementNodesInSelection(selection: RangeSelection): Set<ElementNode> {
  const nodesInSelection = selection.getNodes()

  if (nodesInSelection.length === 0) {
    return new Set([selection.anchor.getNode().getParentOrThrow(), selection.focus.getNode().getParentOrThrow()])
  }

  return new Set(nodesInSelection.map((n) => ($isElementNode(n) ? n : n.getParentOrThrow())))
}

function isIndentPermitted(maxDepth: number): boolean {
  const selection = $getSelection()

  if (!$isRangeSelection(selection)) {
    return false
  }

  const elementNodesInSelection: Set<ElementNode> = getElementNodesInSelection(selection)

  let totalDepth = 0

  for (const elementNode of elementNodesInSelection) {
    if ($isListNode(elementNode)) {
      totalDepth = Math.max($getListDepth(elementNode) + 1, totalDepth)
    } else if ($isListItemNode(elementNode)) {
      const parent = elementNode.getParent()

      // prevent multiple level indentation, markdown does not support it
      if (parent?.getChildren().length === 1) {
        const grandParentListItem = parent?.getParent()
        if ($isListItemNode(grandParentListItem) && grandParentListItem.getChildren().length === 1) {
          return false
        }
      }

      if (!$isListNode(parent)) {
        throw new Error('ListMaxIndentLevelPlugin: A ListItemNode must have a ListNode for a parent.')
      }

      totalDepth = Math.max($getListDepth(parent) + 1, totalDepth)
    }
  }

  return totalDepth <= maxDepth
}
