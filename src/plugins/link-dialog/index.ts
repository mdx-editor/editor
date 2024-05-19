import { $createLinkNode, $isLinkNode, TOGGLE_LINK_COMMAND } from '@lexical/link'
import {
  $createTextNode,
  $getSelection,
  $insertNodes,
  $isRangeSelection,
  COMMAND_PRIORITY_HIGH,
  COMMAND_PRIORITY_LOW,
  KEY_ESCAPE_COMMAND,
  KEY_MODIFIER_COMMAND,
  RangeSelection
} from 'lexical'
import { IS_APPLE } from '../../utils/detectMac'
import { getSelectedNode, getSelectionRectangle } from '../../utils/lexicalHelpers'
import { activeEditor$, addComposerChild$, createActiveEditorSubscription$, currentSelection$, readOnly$ } from '../core'
import { LinkDialog } from './LinkDialog'
import { Action, Cell, Signal, filter, map, withLatestFrom } from '@mdxeditor/gurx'
import { realmPlugin } from '../../RealmWithPlugins'

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
 * Emits when the window is resized.
 * @group Utils
 */
export const onWindowChange$ = Signal<true>()

/**
 * The current state of the link dialog.
 * @group Link Dialog
 */
export const linkDialogState$ = Cell<InactiveLinkDialog | PreviewLinkDialog | EditLinkDialog>({ type: 'inactive' }, (r) => {
  r.pub(createActiveEditorSubscription$, (editor) => {
    return editor.registerCommand(
      KEY_ESCAPE_COMMAND,
      () => {
        const state = r.getValue(linkDialogState$)
        if (state.type === 'preview') {
          r.pub(linkDialogState$, { type: 'inactive' })
          return true
        }
        return false
      },
      COMMAND_PRIORITY_LOW
    )
  })

  r.pub(createActiveEditorSubscription$, (editor) => {
    return editor.registerCommand(
      KEY_MODIFIER_COMMAND,
      (event) => {
        if (event.key === 'k' && (IS_APPLE ? event.metaKey : event.ctrlKey) && !r.getValue(readOnly$)) {
          const selection = $getSelection()
          // we open the dialog if there's an actual selection
          // or if the cursor is inside a link
          if ($isRangeSelection(selection)) {
            r.pub(openLinkEditDialog$)
            event.stopPropagation()
            event.preventDefault()
            return true
          } else {
            return false
          }
        }
        return false
      },
      COMMAND_PRIORITY_HIGH
    )
  })

  r.link(
    r.pipe(
      switchFromPreviewToLinkEdit$,
      withLatestFrom(linkDialogState$),
      map(([, state]) => {
        if (state.type === 'preview') {
          return {
            type: 'edit' as const,
            initialUrl: state.url,
            url: state.url,
            title: state.title,
            linkNodeKey: state.linkNodeKey,
            rectangle: state.rectangle
          } as EditLinkDialog
        } else {
          throw new Error('Cannot switch to edit mode when not in preview mode')
        }
      })
    ),
    linkDialogState$
  )

  r.sub(r.pipe(updateLink$, withLatestFrom(activeEditor$, linkDialogState$, currentSelection$)), ([payload, editor, state, selection]) => {
    const url = payload.url.trim()
    const title = payload.title.trim()

    if (url !== '') {
      if (selection?.isCollapsed()) {
        const linkContent = title || url
        editor?.update(
          () => {
            if (!getLinkNodeInSelection(selection)) {
              const node = $createLinkNode(url, { title })
              node.append($createTextNode(linkContent))
              $insertNodes([node])
              node.select()
            }
          },
          { discrete: true }
        )
      } else {
        editor?.dispatchCommand(TOGGLE_LINK_COMMAND, { url, title })
      }

      r.pub(linkDialogState$, {
        type: 'preview',
        linkNodeKey: state.linkNodeKey,
        rectangle: state.rectangle,
        title,
        url
      } as PreviewLinkDialog)
    } else {
      if (state.type === 'edit' && state.initialUrl !== '') {
        editor?.dispatchCommand(TOGGLE_LINK_COMMAND, null)
      }
      r.pub(linkDialogState$, {
        type: 'inactive'
      })
    }
  })

  r.link(
    r.pipe(
      cancelLinkEdit$,
      withLatestFrom(linkDialogState$, activeEditor$),
      map(([, state, editor]) => {
        if (state.type === 'edit') {
          editor?.focus()
          if (state.initialUrl === '') {
            return {
              type: 'inactive' as const
            } as InactiveLinkDialog
          } else {
            return {
              type: 'preview' as const,
              url: state.initialUrl,
              linkNodeKey: state.linkNodeKey,
              rectangle: state.rectangle
            } as PreviewLinkDialog
          }
        } else {
          throw new Error('Cannot cancel edit when not in edit mode')
        }
      })
    ),
    linkDialogState$
  )

  r.link(
    r.pipe(
      r.combine(currentSelection$, onWindowChange$),
      withLatestFrom(activeEditor$, linkDialogState$, readOnly$),
      map(([[selection], activeEditor, _, readOnly]) => {
        if ($isRangeSelection(selection) && activeEditor && !readOnly) {
          const node = getLinkNodeInSelection(selection)

          if (node) {
            return {
              type: 'preview',
              url: node.getURL(),
              linkNodeKey: node.getKey(),
              title: node.getTitle(),
              rectangle: getSelectionRectangle(activeEditor)
            } as PreviewLinkDialog
          } else {
            return { type: 'inactive' } as InactiveLinkDialog
          }
        } else {
          return { type: 'inactive' } as InactiveLinkDialog
        }
      })
    ),
    linkDialogState$
  )
})

/**
 * A signal that updates the current link with the published payload.
 * @group Link Dialog
 */
export const updateLink$ = Signal<{ url: string; title: string }>()
/**
 * An action that cancel the edit of the current link.
 * @group Link Dialog
 */
export const cancelLinkEdit$ = Action()
/**
 * A signal that confirms the updated values of the current link.
 * @group Link Dialog
 */
export const applyLinkChanges$ = Action()

/**
 * An action that switches the link dialog from preview mode to edit mode.
 * @group Link Dialog
 */
export const switchFromPreviewToLinkEdit$ = Action()

/**
 * A signal that removes the current link.
 * @group Link Dialog
 */
export const removeLink$ = Action((r) => {
  r.sub(r.pipe(removeLink$, withLatestFrom(activeEditor$)), ([, editor]) => {
    editor?.dispatchCommand(TOGGLE_LINK_COMMAND, null)
  })
})

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

/** @internal */
export const linkAutocompleteSuggestions$ = Cell<string[]>([])

export type ClickLinkCallback = (url: string) => void

/** @internal */
export const onClickLinkCallback$ = Cell<ClickLinkCallback | null>(null)

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
