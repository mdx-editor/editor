import React from 'react'
import * as Popover from '@radix-ui/react-popover'
import * as Tooltip from '@radix-ui/react-tooltip'

import { CheckIcon, ClipboardCopyIcon, Cross2Icon, ExternalLinkIcon, LinkBreak1Icon, Pencil1Icon } from '@radix-ui/react-icons'
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_HIGH,
  COMMAND_PRIORITY_LOW,
  ElementNode,
  KEY_MODIFIER_COMMAND,
  KEY_ESCAPE_COMMAND,
  LexicalEditor,
  RangeSelection,
  SELECTION_CHANGE_COMMAND,
  TextNode,
  LexicalCommand,
  createCommand,
} from 'lexical'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $isAtNodeEnd } from '@lexical/selection'
import { mergeRegister } from '@lexical/utils'
import { $isLinkNode, TOGGLE_LINK_COMMAND } from '@lexical/link'
import { LinkTextContainer, LinkUIInput, PopoverButton, PopoverButtons, TooltipArrow, TooltipContent, WorkingLink } from './primitives'
import { PopoverAnchor, PopoverContent } from '../Popover/primitives'

export function getSelectedNode(selection: RangeSelection): TextNode | ElementNode {
  const anchor = selection.anchor
  const focus = selection.focus
  const anchorNode = selection.anchor.getNode()
  const focusNode = selection.focus.getNode()
  if (anchorNode === focusNode) {
    return anchorNode
  }
  const isBackward = selection.isBackward()
  if (isBackward) {
    return $isAtNodeEnd(focus) ? anchorNode : focusNode
  } else {
    return $isAtNodeEnd(anchor) ? anchorNode : focusNode
  }
}

export const OPEN_LINK_DIALOG: LexicalCommand<undefined> = createCommand()

function getSelectionRectangle(editor: LexicalEditor) {
  const selection = $getSelection()
  const nativeSelection = window.getSelection()
  const activeElement = document.activeElement

  const rootElement = editor.getRootElement()

  if (
    selection !== null &&
    nativeSelection !== null &&
    rootElement !== null &&
    rootElement.contains(nativeSelection.anchorNode) &&
    editor.isEditable()
  ) {
    const domRange = nativeSelection.getRangeAt(0)
    let rect
    if (nativeSelection.anchorNode === rootElement) {
      let inner = rootElement
      while (inner.firstElementChild != null) {
        inner = inner.firstElementChild as HTMLElement
      }
      rect = inner.getBoundingClientRect()
    } else {
      rect = domRange.getBoundingClientRect()
    }

    return rect
  } else if (!activeElement || activeElement.className !== 'link-input') {
    return null
  }
  return null
}

export function LinkDialogPlugin() {
  const [editor] = useLexicalComposerContext()
  const [open, setOpen] = React.useState(false)
  const [url, setUrl] = React.useState<string | null>(null)
  const [initialUrl, setInitialUrl] = React.useState<string | null>(null)
  const [rect, setRect] = React.useState<DOMRect | null>(null)
  const [editMode, setEditMode] = React.useState(false)
  const [popoverKey, setPopoverKey] = React.useState('0')

  const applyUrlChanges = React.useCallback(
    (input: HTMLInputElement) => {
      const url = input.value
      if (url.trim() !== '') {
        setEditMode(false)
        editor.dispatchCommand(TOGGLE_LINK_COMMAND, url)
      } else {
        editor.dispatchCommand(TOGGLE_LINK_COMMAND, null)
      }
    },
    [editor]
  )

  const cancelChange = React.useCallback(() => {
    setEditMode(false)
    setUrl(initialUrl)
    if (initialUrl === null) {
      setOpen(false)
      editor.focus()
    }
  }, [initialUrl, editor])

  const onKeyDown = React.useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        applyUrlChanges(e.target as HTMLInputElement)
      } else if (e.key === 'Escape') {
        cancelChange()
      }
    },
    [applyUrlChanges, cancelChange]
  )

  const inputElRef = React.useRef<HTMLInputElement | null>(null)
  const inputRef = React.useCallback(
    (e: HTMLInputElement | null) => {
      if (e !== null) {
        inputElRef.current = e
        inputElRef.current.addEventListener('keydown', onKeyDown)
      } else {
        inputElRef.current?.removeEventListener('keydown', onKeyDown)
        inputElRef.current = null
      }
    },
    [onKeyDown]
  )

  const updateLinkUI = React.useCallback(() => {
    const selection = $getSelection()
    if ($isRangeSelection(selection)) {
      const node = getSelectedNode(selection)
      const parent = node.getParent()
      if ($isLinkNode(parent)) {
        setRect(getSelectionRectangle(editor))
        setUrl(parent.getURL())
        setPopoverKey(parent.getKey())
        setInitialUrl(parent.getURL())
        setEditMode(false)
        setOpen(true)
      } else if ($isLinkNode(node)) {
        setRect(getSelectionRectangle(editor))
        setPopoverKey(node.getKey())
        setUrl(node.getURL())
        setInitialUrl(node.getURL())
        setEditMode(false)
        setOpen(true)
      } else {
        setUrl(null)
        setEditMode(false)
        setRect(null)
      }
    } else {
      setUrl(null)
      setEditMode(false)
    }
  }, [editor])

  React.useEffect(() => {
    const update = () => {
      editor.getEditorState().read(() => {
        updateLinkUI()
      })
    }

    window.addEventListener('resize', update)
    // TODO: get the right scroller
    window.addEventListener('scroll', update)

    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update)
    }
  }, [editor, updateLinkUI])

  React.useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          updateLinkUI()
        })
      }),

      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          updateLinkUI()
          return true
        },
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        KEY_ESCAPE_COMMAND,
        () => {
          // this is kinda hacky, relying on a sync state update to return a value
          let shouldHandle = false
          setOpen((value) => {
            shouldHandle = value
            return false
          })
          return shouldHandle
        },
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        OPEN_LINK_DIALOG,
        () => {
          const selection = $getSelection()
          if ($isRangeSelection(selection)) {
            const node = getSelectedNode(selection)
            const parent = node.getParent()
            if ($isLinkNode(parent)) {
              setEditMode(true)
            } else if ($isLinkNode(node)) {
              setRect(getSelectionRectangle(editor))
              setUrl(node.getURL())
              setInitialUrl(node.getURL())
              setEditMode(true)
              setOpen(true)
            } else {
              setRect(getSelectionRectangle(editor))
              setUrl('')
              setInitialUrl(null)
              setEditMode(true)
              setOpen(true)
            }
          }
          return true
        },
        COMMAND_PRIORITY_HIGH
      ),
      editor.registerCommand(
        KEY_MODIFIER_COMMAND,
        (event) => {
          // TODO: handle windows
          if (event.key === 'k' && event.metaKey) {
            editor.dispatchCommand(OPEN_LINK_DIALOG, undefined)
            return true
          }
          return false
        },
        COMMAND_PRIORITY_HIGH
      )
    )
  }, [editor, updateLinkUI])

  React.useEffect(() => {
    editor.getEditorState().read(() => {
      updateLinkUI()
    })
  }, [editor, updateLinkUI])

  const [copyUrlTooltipOpen, setCopyUrlTooltipOpen] = React.useState(false)

  return (
    <Popover.Root open={open && !!rect}>
      <PopoverAnchor
        style={{
          visibility: open && editMode ? 'visible' : 'hidden',
          top: rect?.top,
          left: rect?.left,
          width: rect?.width,
          height: rect?.height,
        }}
      />

      <Popover.Portal>
        <PopoverContent sideOffset={5} onOpenAutoFocus={(e) => e.preventDefault()} key={popoverKey}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
            {editMode ? (
              <LinkUIInput value={url || ''} ref={inputRef} onChange={(e) => setUrl(e.target.value)} autoFocus />
            ) : (
              <WorkingLink href={url!} target="_blank" rel="noreferrer" title={url!}>
                <LinkTextContainer>{url}</LinkTextContainer>
                <ExternalLinkIcon />
              </WorkingLink>
            )}
          </div>
          <PopoverButtons>
            {editMode ? (
              <>
                <PopoverButton onClick={() => applyUrlChanges(inputElRef.current!)} title="Set URL" aria-label="Set URL">
                  <CheckIcon />
                </PopoverButton>

                <PopoverButton onClick={cancelChange} title="Cancel change" aria-label="Cancel change">
                  <Cross2Icon />
                </PopoverButton>
              </>
            ) : (
              <>
                <PopoverButton onClick={() => setEditMode((v) => !v)} title="Edit link URL" aria-label="Edit link URL">
                  <Pencil1Icon />
                </PopoverButton>
                <Tooltip.Provider>
                  <Tooltip.Root open={copyUrlTooltipOpen}>
                    <Tooltip.Trigger asChild>
                      <PopoverButton
                        title="Copy to clipboard"
                        aria-label="Copy link URL"
                        onClick={() => {
                          void window.navigator.clipboard.writeText(url!).then(() => {
                            setCopyUrlTooltipOpen(true)
                            setTimeout(() => setCopyUrlTooltipOpen(false), 1000)
                          })
                        }}
                      >
                        {copyUrlTooltipOpen ? <CheckIcon /> : <ClipboardCopyIcon />}
                      </PopoverButton>
                    </Tooltip.Trigger>
                    <Tooltip.Portal>
                      <TooltipContent sideOffset={5}>
                        Copied!
                        <TooltipArrow />
                      </TooltipContent>
                    </Tooltip.Portal>
                  </Tooltip.Root>
                </Tooltip.Provider>

                <PopoverButton
                  title="Remove link"
                  aria-label="Remove link"
                  onClick={() => {
                    editor.dispatchCommand(TOGGLE_LINK_COMMAND, null)
                  }}
                >
                  <LinkBreak1Icon />
                </PopoverButton>
              </>
            )}
          </PopoverButtons>
        </PopoverContent>
      </Popover.Portal>
    </Popover.Root>
  )
}
