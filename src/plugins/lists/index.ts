import { realmPlugin, system } from '../../gurx'
import { coreSystem } from '../core'
import { MdastListVisitor } from './MdastListVisitor'
import { MdastListItemVisitor } from './MdastListItemVisitor'
import { LexicalListVisitor } from './LexicalListVisitor'
import { LexicalListItemVisitor } from './LexicalListItemVisitor'
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  ListItemNode,
  ListNode,
  ListType,
  REMOVE_LIST_COMMAND
} from '@lexical/list'
import { $isRootOrShadowRoot, LexicalCommand, RangeSelection } from 'lexical'
import { $getListDepth, $isListItemNode, $isListNode } from '@lexical/list'
import { $getSelection, $isElementNode, $isRangeSelection, COMMAND_PRIORITY_CRITICAL, ElementNode, INDENT_CONTENT_COMMAND } from 'lexical'
import { TabIndentationPlugin } from '@lexical/react/LexicalTabIndentationPlugin'
import { ListPlugin } from '@lexical/react/LexicalListPlugin'
import { $findMatchingParent, $getNearestNodeOfType } from '@lexical/utils'

const ListTypeCommandMap = new Map<ListType | '', LexicalCommand<void>>([
  ['number', INSERT_ORDERED_LIST_COMMAND],
  ['bullet', INSERT_UNORDERED_LIST_COMMAND],
  ['', REMOVE_LIST_COMMAND]
])

export const listsSystem = system(
  (r, [{ activeEditor, currentSelection }]) => {
    const currentListType = r.node<ListType | ''>('')
    const applyListType = r.node<ListType | ''>()

    r.sub(r.pipe(applyListType, r.o.withLatestFrom(activeEditor)), ([listType, theEditor]) => {
      theEditor?.dispatchCommand(ListTypeCommandMap.get(listType)!, undefined)
    })

    r.sub(r.pipe(currentSelection, r.o.withLatestFrom(activeEditor)), ([selection, theEditor]) => {
      if (!selection || !theEditor) {
        return
      }

      const anchorNode = selection.anchor.getNode()
      let element =
        anchorNode.getKey() === 'root'
          ? anchorNode
          : $findMatchingParent(anchorNode, (e) => {
              const parent = e.getParent()
              return parent !== null && $isRootOrShadowRoot(parent)
            })

      if (element === null) {
        element = anchorNode.getTopLevelElementOrThrow()
      }

      const elementKey = element.getKey()
      const elementDOM = theEditor.getElementByKey(elementKey)

      if (elementDOM !== null) {
        if ($isListNode(element)) {
          const parentList = $getNearestNodeOfType<ListNode>(anchorNode, ListNode)
          const type = parentList ? parentList.getListType() : element.getListType()
          r.pub(currentListType, type)
        } else {
          r.pub(currentListType, null)
        }
      }
    })

    return { currentListType, applyListType }
  },
  [coreSystem]
)

export const [listsPlugin, listsPluginHooks] = realmPlugin({
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
