import { $isLinkNode, TOGGLE_LINK_COMMAND } from '@lexical/link'
import {
  $isRangeSelection,
  COMMAND_PRIORITY_HIGH,
  COMMAND_PRIORITY_LOW,
  KEY_ESCAPE_COMMAND,
  KEY_MODIFIER_COMMAND,
  RangeSelection
} from 'lexical'
import { realmPlugin, system } from '../../gurx'
import { IS_APPLE } from '../../utils/detectMac'
import { getSelectedNode, getSelectionRectangle } from '../../utils/lexicalHelpers'
import { coreSystem } from '../core'
import { LinkDialog } from './LinkDialog'

export interface InactiveLinkDialog {
  type: 'inactive'
  rectangle?: undefined
  linkNodeKey?: undefined
}

type RectData = Pick<DOMRect, 'height' | 'width' | 'top' | 'left'>

export interface PreviewLinkDialog {
  type: 'preview'
  url: string
  linkNodeKey: string
  rectangle: RectData
}

export interface EditLinkDialog {
  type: 'edit'
  initialUrl: string
  url: string
  linkNodeKey: string
  rectangle: RectData
}

function getLinkNodeInSelection(selection: RangeSelection | null) {
  if (!selection) {
    return null
  }
  const node = getSelectedNode(selection)
  const parent = node.getParent()
  if ($isLinkNode(parent)) {
    return parent
  } else if ($isLinkNode(node)) {
    return node
  }
  return null
}

export const linkDialogSystem = system(
  (r, [{ activeEditor, currentSelection, createActiveEditorSubscription }]) => {
    const dialogState = r.node(false)
    // node that publishes signals when the window gets resized or scrolled
    const onWindowChange = r.node<true>()
    const linkDialogState = r.node<InactiveLinkDialog | PreviewLinkDialog | EditLinkDialog>({ type: 'inactive' }, true)

    // actions
    const updateLinkUrl = r.node<string>()
    const cancelLinkEdit = r.node<true>()
    const applyLinkChanges = r.node<true>()
    const switchFromPreviewToLinkEdit = r.node<true>()
    const removeLink = r.node<true>()
    const openLinkEditDialog = r.node<true>()
    const linkAutocompleteSuggestions = r.node<string[]>([])

    r.sub(
      r.pipe(
        openLinkEditDialog,
        r.o.withLatestFrom(currentSelection, activeEditor),
        r.o.filter(([, selection]) => $isRangeSelection(selection))
      ),
      ([, selection, editor]) => {
        editor?.getEditorState().read(() => {
          const node = getLinkNodeInSelection(selection)
          const rectangle = getSelectionRectangle(editor)!
          if (node) {
            r.pub(linkDialogState, {
              type: 'edit',
              initialUrl: node.getURL(),
              url: node.getURL(),
              linkNodeKey: node.getKey(),
              rectangle
            })
          } else {
            r.pub(linkDialogState, {
              type: 'edit',
              initialUrl: '',
              url: '',
              linkNodeKey: '',
              rectangle
            })
          }
        })
      }
    )

    r.sub(r.pipe(removeLink, r.o.withLatestFrom(activeEditor)), ([, editor]) => {
      editor?.dispatchCommand(TOGGLE_LINK_COMMAND, null)
    })

    r.pub(createActiveEditorSubscription, (editor) => {
      return editor.registerCommand(
        KEY_ESCAPE_COMMAND,
        () => {
          const state = r.getValue(linkDialogState)
          if (state.type === 'preview') {
            r.pub(linkDialogState, { type: 'inactive' })
            return true
          }
          return false
        },
        COMMAND_PRIORITY_LOW
      )
    })

    r.pub(createActiveEditorSubscription, (editor) => {
      return editor.registerCommand(
        KEY_MODIFIER_COMMAND,
        (event) => {
          if (event.key === 'k' && (IS_APPLE ? event.metaKey : event.ctrlKey)) {
            r.pub(openLinkEditDialog, true)
            return true
          }
          return false
        },
        COMMAND_PRIORITY_HIGH
      )
    })

    r.link(
      r.pipe(
        switchFromPreviewToLinkEdit,
        r.o.withLatestFrom(linkDialogState),
        r.o.map(([, state]) => {
          if (state.type === 'preview') {
            return {
              type: 'edit' as const,
              initialUrl: state.url,
              url: state.url,
              linkNodeKey: state.linkNodeKey,
              rectangle: state.rectangle
            }
          } else {
            throw new Error('Cannot switch to edit mode when not in preview mode')
          }
        })
      ),
      linkDialogState
    )

    r.sub(r.pipe(applyLinkChanges, r.o.withLatestFrom(linkDialogState, activeEditor)), ([, state, editor]) => {
      if (state.type === 'edit') {
        const url = state.url.trim()
        if (url.trim() !== '') {
          editor?.dispatchCommand(TOGGLE_LINK_COMMAND, url)
          r.pub(linkDialogState, {
            type: 'preview',
            linkNodeKey: state.linkNodeKey,
            rectangle: state.rectangle,
            url
          })
        } else {
          if (state.initialUrl !== '') {
            editor?.dispatchCommand(TOGGLE_LINK_COMMAND, null)
          }
          r.pub(linkDialogState, {
            type: 'inactive'
          })
        }
      } else {
        throw new Error('Cannot apply link edit when not in edit mode')
      }
    })

    r.link(
      r.pipe(
        updateLinkUrl,
        r.o.withLatestFrom(linkDialogState),
        r.o.map(([url, state]) => {
          if (state.type === 'edit') {
            return {
              ...state,
              url
            }
          } else {
            throw new Error('Cannot update link url when not in edit mode')
          }
        })
      ),
      linkDialogState
    )

    r.link(
      r.pipe(
        cancelLinkEdit,
        r.o.withLatestFrom(linkDialogState, activeEditor),
        r.o.map(([, state, editor]) => {
          if (state.type === 'edit') {
            editor?.focus()
            if (state.initialUrl === '') {
              return {
                type: 'inactive' as const
              }
            } else {
              return {
                type: 'preview' as const,
                url: state.initialUrl,
                linkNodeKey: state.linkNodeKey,
                rectangle: state.rectangle
              }
            }
          } else {
            throw new Error('Cannot cancel edit when not in edit mode')
          }
        })
      ),
      linkDialogState
    )

    r.link(
      r.pipe(
        r.combine(currentSelection, onWindowChange),
        r.o.withLatestFrom(activeEditor, linkDialogState),
        r.o.map(([[selection], activeEditor]) => {
          if ($isRangeSelection(selection) && activeEditor) {
            const node = getLinkNodeInSelection(selection)

            if (node) {
              return {
                type: 'preview' as const,
                url: node.getURL(),
                linkNodeKey: node.getKey(),
                rectangle: getSelectionRectangle(activeEditor)
              }
            } else {
              return {
                type: 'inactive' as const
              }
            }
          } else {
            return {
              type: 'inactive' as const
            }
          }
        })
      ),
      linkDialogState
    )

    return {
      dialogState,
      onWindowChange,
      linkDialogState,
      updateLinkUrl,
      switchFromPreviewToLinkEdit,
      cancelLinkEdit,
      removeLink,
      openLinkEditDialog,
      applyLinkChanges,
      linkAutocompleteSuggestions
    }
  },
  [coreSystem]
)

export const [linkDialogPlugin, linkDialogPluginHooks] = realmPlugin({
  id: 'link-dialog',
  dependencies: ['link'],
  systemSpec: linkDialogSystem,
  applyParamsToSystem(r, params: { linkAutocompleteSuggestions?: string[] } = {}) {
    r.pubKey('linkAutocompleteSuggestions', params.linkAutocompleteSuggestions || [])
  },
  init(r) {
    r.pubKey('addComposerChild', LinkDialog)
  }
})
