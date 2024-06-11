import { $isLinkNode } from '@lexical/link'
import { $isRangeSelection, RangeSelection } from 'lexical'
import { getSelectedNode, getSelectionRectangle } from '../../utils/lexicalHelpers'
import { activeEditor$, addComposerChild$, currentSelection$ } from '../core'
import { LinkDialog } from './LinkDialog'
import { Action, filter, withLatestFrom } from '@mdxeditor/gurx'
import { realmPlugin } from '../../RealmWithPlugins'
import { ClickLinkCallback, linkAutocompleteSuggestions$, linkDialogState$, onClickLinkCallback$ } from './utils'

/**
 * Describes the boundaries of the current selection so that the link dialog can position itself accordingly.
 * @group Link Dialog
 */
export type RectData = Pick<DOMRect, 'height' | 'width' | 'top' | 'left'>

/**
 * The state of the link dialog when it is inactive.
 * @group Link Dialog
 */
export interface InactiveLinkDialog {
  type: 'inactive'
  rectangle?: undefined
  linkNodeKey?: undefined
}

/**
 * The state of the link dialog when it is in preview mode.
 * @group Link Dialog
 */
export interface PreviewLinkDialog {
  type: 'preview'
  title: string
  url: string
  linkNodeKey: string
  rectangle: RectData
}

/**
 * The state of the link dialog when it is in edit mode.
 * @group Link Dialog
 */
export interface EditLinkDialog {
  type: 'edit'
  initialUrl: string
  initialTitle?: string
  url: string
  title: string
  linkNodeKey: string
  rectangle: RectData
}

function getLinkNodeInSelection(selection: RangeSelection | null) {
  if (!selection) {
    return null
  }
  const node = getSelectedNode(selection)
  if (node === null) {
    return null
  }
  const parent = node.getParent()
  if ($isLinkNode(parent)) {
    return parent
  } else if ($isLinkNode(node)) {
    return node
  }
  return null
}

/**
 * An action that opens the link dialog.
 * @group Link Dialog
 */
export const openLinkEditDialog$ = Action((r) => {
  r.sub(
    r.pipe(
      openLinkEditDialog$,
      withLatestFrom(currentSelection$, activeEditor$),
      filter(([, selection]) => $isRangeSelection(selection))
    ),
    ([, selection, editor]) => {
      editor?.focus(() => {
        editor.getEditorState().read(() => {
          const node = getLinkNodeInSelection(selection)
          const rectangle = getSelectionRectangle(editor)!
          if (node) {
            r.pub(linkDialogState$, {
              type: 'edit',
              initialUrl: node.getURL(),
              initialTitle: node.getTitle() ?? '',
              url: node.getURL(),
              title: node.getTitle() ?? '',
              linkNodeKey: node.getKey(),
              rectangle
            })
          } else {
            r.pub(linkDialogState$, {
              type: 'edit',
              initialUrl: '',
              initialTitle: '',
              title: '',
              url: '',
              linkNodeKey: '',
              rectangle
            })
          }
        })
      })
    }
  )
})

/**
 * @group Link Dialog
 */
export const linkDialogPlugin = realmPlugin<{
  /**
   * If passed, the link dialog will be rendered using this component instead of the default one.
   */
  LinkDialog?: () => JSX.Element
  /**
   * If passed, the link input field will autocomplete using the published suggestions.
   */
  linkAutocompleteSuggestions?: string[]
  /**
   * If set, clicking on the link in the preview popup will call this callback instead of opening the link.
   */
  onClickLinkCallback?: ClickLinkCallback
}>({
  init(r, params) {
    r.pub(addComposerChild$, params?.LinkDialog ?? LinkDialog)
    r.pub(onClickLinkCallback$, params?.onClickLinkCallback ?? null)
  },
  update(r, params = {}) {
    r.pub(linkAutocompleteSuggestions$, params.linkAutocompleteSuggestions ?? [])
  }
})
