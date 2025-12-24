import { $trimTextContentFromAnchor } from '@lexical/selection'
import { $restoreEditorState } from '@lexical/utils'
import { $getSelection, $isRangeSelection, EditorState, RootNode } from 'lexical'
import { realmPlugin } from '../../RealmWithPlugins'
import { createRootEditorSubscription$ } from '../core'

/**
 * A plugin that limits the maximum length of the text content of the editor.
 * Adapted from the Lexical plugin. https://github.com/facebook/lexical/blob/main/packages/lexical-playground/src/plugins/MaxLengthPlugin/index.tsx
 * @example
 * ```tsx
 *    <MDXEditor plugins={[maxLengthPlugin(100)]} markdown={'hello world'} />
 * ```
 * @group Utilities
 */
export const maxLengthPlugin = realmPlugin<number>({
  init: (realm, maxLength = Infinity) => {
    realm.pub(createRootEditorSubscription$, (editor) => {
      let lastRestoredEditorState: EditorState | null = null

      return editor.registerNodeTransform(RootNode, (rootNode: RootNode) => {
        const selection = $getSelection()
        if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
          return
        }
        const prevEditorState = editor.getEditorState()
        const prevTextContentSize = prevEditorState.read(() => rootNode.getTextContentSize())
        const textContentSize = rootNode.getTextContentSize()
        if (prevTextContentSize !== textContentSize) {
          const delCount = textContentSize - maxLength
          const anchor = selection.anchor

          if (delCount > 0) {
            // Restore the old editor state instead if the last
            // text content was already at the limit.
            if (prevTextContentSize === maxLength && lastRestoredEditorState !== prevEditorState) {
              lastRestoredEditorState = prevEditorState
              $restoreEditorState(editor, prevEditorState)
            } else {
              $trimTextContentFromAnchor(editor, anchor, delCount)
            }
          }
        }
      })
    })
  }
})
