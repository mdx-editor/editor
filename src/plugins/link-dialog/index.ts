import { $createLinkNode, $isAutoLinkNode, $isLinkNode, LinkNode, TOGGLE_LINK_COMMAND } from '@lexical/link'
import { Action, Cell, Signal, map, withLatestFrom } from '@mdxeditor/gurx'
import { JSX } from 'react'
import {
  $createNodeSelection,
  $createTextNode,
  $getNearestNodeFromDOMNode,
  $getNodeByKey,
  $getSelection,
  $insertNodes,
  $isDecoratorNode,
  $isNodeSelection,
  $isRangeSelection,
  $isTextNode,
  $setSelection,
  COMMAND_PRIORITY_HIGH,
  COMMAND_PRIORITY_LOW,
  KEY_DOWN_COMMAND,
  KEY_ESCAPE_COMMAND,
  type LexicalEditor,
  type LexicalNode,
  type RangeSelection
} from 'lexical'
import { realmPlugin } from '../../RealmWithPlugins'
import { IS_APPLE } from '../../utils/detectMac'
import { getNodeRectangle, getSelectedNode, getSelectionRectangle } from '../../utils/lexicalHelpers'
import { activeEditor$, addComposerChild$, createActiveEditorSubscription$, currentSelection$, readOnly$, viewMode$ } from '../core'
import { LinkDialog } from './LinkDialog'
import { $findMatchingParent } from '@lexical/utils'

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
  decoratorNodeKey?: undefined
}

/**
 * The state of the link dialog when it is in preview mode.
 * @group Link Dialog
 */
export interface PreviewLinkDialog {
  type: 'preview'
  title: string
  url: string
  /** The fail-closed URL used only for automatic preview navigation. */
  href?: string
  linkNodeKey: string
  /** Set when the link wraps a single inline decorator node (e.g. an image) that the dialog targets. */
  decoratorNodeKey?: string
  rectangle: RectData
}

/**
 * The state of the link dialog when it is in edit mode.
 * @group Link Dialog
 */
export interface EditLinkDialog {
  type: 'edit'
  initialUrl: string
  url: string
  title: string
  text: string
  withAnchorText: boolean
  linkNodeKey: string
  /** Set when the dialog targets a single inline decorator node (e.g. an image) instead of a text selection. */
  decoratorNodeKey?: string
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

function getSelectedInlineDecorator(selection = $getSelection()) {
  if (!$isNodeSelection(selection)) {
    return null
  }
  const nodes = selection.getNodes()
  const node = nodes.length === 1 ? nodes[0] : null
  return $isDecoratorNode(node) && node.isInline() ? node : null
}

function getPreviewHref(editor: LexicalEditor | null, linkNodeKey: string, url: string): string {
  if (!editor) return 'about:blank'

  return editor.getEditorState().read(() => {
    const keyedNode = linkNodeKey === '' ? null : $getNodeByKey(linkNodeKey)
    const selection = $getSelection()
    const selectedNode = $isRangeSelection(selection) ? getLinkNodeInSelection(selection) : null
    const linkNode = $isLinkNode(keyedNode) ? keyedNode : selectedNode
    return linkNode?.sanitizeUrl(url) ?? 'about:blank'
  })
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

  r.sub(r.pipe(viewMode$), (viewMode) => {
    if (viewMode !== 'rich-text') {
      r.pub(linkDialogState$, { type: 'inactive' })
    }
  })

  r.pub(createActiveEditorSubscription$, (editor) => {
    return editor.registerCommand(
      KEY_DOWN_COMMAND,
      (event) => {
        if (event.key === 'k' && (IS_APPLE ? event.metaKey : event.ctrlKey) && !r.getValue(readOnly$)) {
          const selection = $getSelection()
          // we open the dialog if there's an actual selection, if the cursor is
          // inside a link, or if an inline decorator node (e.g. an image) is selected
          if ($isRangeSelection(selection) || getSelectedInlineDecorator(selection) !== null) {
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

  r.sub(r.pipe(switchFromPreviewToLinkEdit$, withLatestFrom(linkDialogState$, activeEditor$)), ([, state, editor]) => {
    if (state.type === 'preview') {
      setTimeout(() => {
        editor?.getEditorState().read(() => {
          const node = $getNodeByKey(state.linkNodeKey)
          const withAnchorText = $isLinkNode(node) ? node.getTextContent().length > 0 && node.getChildrenSize() <= 1 : false
          const text = withAnchorText && node ? node.getTextContent() : ''

          r.pub(linkDialogState$, {
            type: 'edit' as const,
            initialUrl: state.url,
            url: state.url,
            title: state.title,
            text,
            withAnchorText,
            linkNodeKey: state.linkNodeKey,
            decoratorNodeKey: state.decoratorNodeKey,
            rectangle: state.rectangle
          } as EditLinkDialog)
        })
      })
    } else {
      throw new Error('Cannot switch to edit mode when not in preview mode')
    }
  })

  r.sub(r.pipe(updateLink$, withLatestFrom(activeEditor$, linkDialogState$, currentSelection$)), ([payload, editor, state, selection]) => {
    const text = payload.text?.trim() ?? ''
    const url = payload.url?.trim() ?? ''
    const title = payload.title?.trim() ?? ''

    if (url !== '') {
      if (state.decoratorNodeKey !== undefined) {
        let linkNodeKey = ''
        let linkApplied = false

        editor?.update(
          () => {
            const node = $getNodeByKey(state.decoratorNodeKey!)
            if (node === null) {
              return
            }
            const nodeSelection = $createNodeSelection()
            nodeSelection.add(node.getKey())
            $setSelection(nodeSelection)
            linkApplied = editor.dispatchCommand(TOGGLE_LINK_COMMAND, url)
            if (!linkApplied) {
              return
            }
            const parent = node.getParent()
            if ($isLinkNode(parent)) {
              parent.setTitle(title)
              linkNodeKey = parent.getKey()
            }
          },
          { discrete: true }
        )

        if (linkNodeKey === '') {
          return
        }

        r.pub(linkDialogState$, {
          type: 'preview',
          linkNodeKey,
          decoratorNodeKey: state.decoratorNodeKey,
          rectangle: state.rectangle,
          title,
          url,
          href: getPreviewHref(editor, linkNodeKey, url)
        } as PreviewLinkDialog)
        return
      }

      if (selection?.isCollapsed()) {
        const linkContent = text || title || url

        editor?.update(
          () => {
            const linkNode = getLinkNodeInSelection(selection)

            if (!linkNode) {
              const node = $createLinkNode(url, { title })

              node.append($createTextNode(linkContent))
              $insertNodes([node])
              node.select()
            } else {
              if ($isAutoLinkNode(linkNode)) {
                const newLinkNode = $createLinkNode(url, { title })
                newLinkNode.append($createTextNode(text))
                linkNode.replace(newLinkNode)
                newLinkNode.select()
              } else {
                linkNode.setURL(url)
                linkNode.setTitle(title)
                updateLinkText(linkNode.getFirstChild(), text)
              }
            }
          },
          { discrete: true }
        )
      } else {
        editor?.update(() => {
          updateLinkText(selection?.anchor.getNode(), text)
        })
        editor?.dispatchCommand(TOGGLE_LINK_COMMAND, { url, title })
      }

      r.pub(linkDialogState$, {
        type: 'preview',
        linkNodeKey: state.linkNodeKey,
        rectangle: state.rectangle,
        title,
        url,
        href: getPreviewHref(editor, state.linkNodeKey ?? '', url)
      } as PreviewLinkDialog)
    } else {
      if (state.type === 'edit' && state.initialUrl !== '') {
        if (state.decoratorNodeKey !== undefined) {
          editor?.update(() => {
            const node = $getNodeByKey(state.decoratorNodeKey!)
            if (node === null) {
              return
            }
            const nodeSelection = $createNodeSelection()
            nodeSelection.add(node.getKey())
            $setSelection(nodeSelection)
            editor.dispatchCommand(TOGGLE_LINK_COMMAND, null)
          })
        } else {
          editor?.dispatchCommand(TOGGLE_LINK_COMMAND, null)
        }
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
              href: getPreviewHref(editor, state.linkNodeKey, state.initialUrl),
              linkNodeKey: state.linkNodeKey,
              decoratorNodeKey: state.decoratorNodeKey,
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
      map(([[selection], activeEditor, state, readOnly]) => {
        if (state.decoratorNodeKey !== undefined && activeEditor && !readOnly) {
          const selectedDecoratorKey = activeEditor.getEditorState().read(() => {
            const editorSelection = $getSelection()
            if (!$isNodeSelection(editorSelection)) {
              return null
            }
            const nodes = editorSelection.getNodes()
            return nodes.length === 1 ? nodes[0].getKey() : null
          })

          if (selectedDecoratorKey !== state.decoratorNodeKey) {
            return { type: 'inactive' } as InactiveLinkDialog
          }

          const rectangle = getNodeRectangle(activeEditor, state.decoratorNodeKey)
          return rectangle === null ? ({ type: 'inactive' } as InactiveLinkDialog) : { ...state, rectangle }
        }

        if ($isRangeSelection(selection) && activeEditor && !readOnly) {
          const node = getLinkNodeInSelection(selection)
          if (!selection.isCollapsed()) return { type: 'inactive' } as InactiveLinkDialog
          if (node) {
            const rect = getSelectionRectangle(activeEditor)

            if (!rect) {
              return { type: 'inactive' } as InactiveLinkDialog
            }

            return {
              type: 'preview',
              url: node.getURL(),
              href: node.sanitizeUrl(node.getURL()),
              linkNodeKey: node.getKey(),
              title: node.getTitle(),
              rectangle: rect
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
export const updateLink$ = Signal<{ text: string | undefined; url: string | undefined; title: string | undefined }>()
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
  r.sub(r.pipe(openLinkEditDialog$, withLatestFrom(currentSelection$, activeEditor$)), ([, selection, editor]) => {
    if (!editor) {
      return
    }

    // an inline decorator node (e.g. an image) is selected - target it so that
    // the update wraps it in a link instead of acting on the stale text selection.
    const decorator = editor.getEditorState().read(() => {
      const node = getSelectedInlineDecorator()
      if (node === null) {
        return null
      }
      const parent = node.getParent()
      const linkNode = $isLinkNode(parent) ? parent : null
      return {
        nodeKey: node.getKey(),
        url: linkNode?.getURL() ?? '',
        title: linkNode?.getTitle() ?? '',
        linkNodeKey: linkNode?.getKey() ?? ''
      }
    })

    if (decorator !== null) {
      const rectangle = getNodeRectangle(editor, decorator.nodeKey)
      if (rectangle === null) {
        return
      }
      r.pub(linkDialogState$, {
        type: 'edit',
        initialUrl: decorator.url,
        url: decorator.url,
        title: decorator.title,
        text: '',
        withAnchorText: false,
        linkNodeKey: decorator.linkNodeKey,
        decoratorNodeKey: decorator.nodeKey,
        rectangle
      })
      return
    }

    if (!$isRangeSelection(selection)) {
      return
    }

    editor.focus(() => {
      setTimeout(() => {
        editor.getEditorState().read(() => {
          const linkNode = getLinkNodeInSelection(selection)
          const rectangle = getSelectionRectangle(editor)
          if (rectangle === null) {
            return
          }
          const initialUrl = linkNode?.getURL() ?? ''
          const url = linkNode?.getURL() ?? ''
          const title = linkNode?.getTitle() ?? ''
          const linkNodeKey = linkNode?.getKey() ?? ''

          const withAnchorText = linkNode
            ? linkNode.getTextContent().length > 0 && linkNode.getChildrenSize() <= 1
            : selection.isCollapsed()

          const text = withAnchorText && linkNode ? linkNode.getTextContent() : ''

          r.pub(linkDialogState$, {
            type: 'edit',
            initialUrl,
            url,
            title,
            text,
            withAnchorText,
            linkNodeKey,
            rectangle
          })
        })
      })
    })
  })
})

/** @internal */
export const linkAutocompleteSuggestions$ = Cell<string[]>([])

export type ClickLinkCallback = (url: string) => void

export type ReadOnlyClickLinkCallback = (event: MouseEvent, node: LinkNode, url: string) => void

/** @internal */
export const onClickLinkCallback$ = Cell<ClickLinkCallback | null>(null)

/** @internal */
export const onReadOnlyClickLinkCallback$ = Cell<ReadOnlyClickLinkCallback | null>(null, (r) => {
  r.pub(createActiveEditorSubscription$, (editor) => {
    function onClick(event: MouseEvent) {
      const [readOnly, callback] = r.getValues([readOnly$, onReadOnlyClickLinkCallback$])
      if (!readOnly || callback === null) {
        return
      }
      editor.update(() => {
        const nearestNode = $getNearestNodeFromDOMNode(event.target as Element)
        if (nearestNode !== null) {
          const targetNode = $findMatchingParent(nearestNode, (node) => node instanceof LinkNode) as LinkNode | null
          if (targetNode !== null) {
            callback(event, targetNode, targetNode.getURL())
          }
        }
      })
    }
    return editor.registerRootListener((rootElement, prevRoot) => {
      if (rootElement) {
        rootElement.addEventListener('click', onClick)
      }
      if (prevRoot) {
        prevRoot.removeEventListener('click', onClick)
      }
    })
  })
})

/** @internal */
function updateLinkText(node: LexicalNode | null | undefined, text: string) {
  if ($isTextNode(node) && text) {
    node.setTextContent(text)
    node.selectStart()
  }
}

export const showLinkTitleField$ = Cell<boolean>(true)

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

  /**
   * Invoked when a link is clicked in read-only mode
   */
  onReadOnlyClickLinkCallback?: ReadOnlyClickLinkCallback

  /**
   * If true, show the "Link title" field in link dialogs (this sets mouseover text, NOT anchor text)
   */
  showLinkTitleField?: boolean
}>({
  init(r, params) {
    r.pub(addComposerChild$, params?.LinkDialog ?? LinkDialog)
    r.pub(onClickLinkCallback$, params?.onClickLinkCallback ?? null)
    r.pub(onReadOnlyClickLinkCallback$, params?.onReadOnlyClickLinkCallback ?? null)
    r.pub(showLinkTitleField$, params?.showLinkTitleField ?? true)
  },
  update(r, params = {}) {
    r.pub(linkAutocompleteSuggestions$, params.linkAutocompleteSuggestions ?? [])
  }
})
