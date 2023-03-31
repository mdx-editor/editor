import React from 'react'
import * as Popover from '@radix-ui/react-popover'
import * as Tooltip from '@radix-ui/react-tooltip'

import {
  COMMAND_PRIORITY_HIGH,
  COMMAND_PRIORITY_LOW,
  createCommand,
  KEY_ESCAPE_COMMAND,
  KEY_MODIFIER_COMMAND,
  LexicalCommand,
} from 'lexical'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { mergeRegister } from '@lexical/utils'
import { LinkTextContainer, LinkUIInput, PopoverButton, TooltipArrow, TooltipContent, WorkingLink } from './primitives'
import { PopoverAnchor, PopoverContent } from '../Popover/primitives'
import { ReactComponent as LinkOffIcon } from './icons/link_off.svg'
import { ReactComponent as CheckIcon } from './icons/check.svg'
import { ReactComponent as CloseIcon } from './icons/close.svg'
import { ReactComponent as CopyIcon } from './icons/content_copy.svg'
import { ReactComponent as EditIcon } from './icons/edit.svg'
import { ReactComponent as OpenInNewIcon } from './icons/open_in_new.svg'
import { useEmitterValues, usePublisher } from '../../system'

export const OPEN_LINK_DIALOG: LexicalCommand<undefined> = createCommand()

export function LinkDialogPlugin() {
  const publishWindowChange = usePublisher('onWindowChange')
  const [editor] = useLexicalComposerContext()
  const [linkDialogState] = useEmitterValues('linkDialogState')
  const updateLinkUrl = usePublisher('updateLinkUrl')
  const cancelLinkEdit = usePublisher('cancelLinkEdit')
  const switchFromPreviewToLinkEdit = usePublisher('switchFromPreviewToLinkEdit')
  const removeLink = usePublisher('removeLink')
  const applyLinkChanges = usePublisher('applyLinkChanges')

  const onKeyDown = React.useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        applyLinkChanges(true)
      } else if (e.key === 'Escape') {
        cancelLinkEdit(true)
      }
    },
    [applyLinkChanges, cancelLinkEdit]
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

  React.useEffect(() => {
    const update = () => {
      publishWindowChange(true)
    }

    window.addEventListener('resize', update)
    // TODO: get the right scroller
    window.addEventListener('scroll', update)

    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update)
    }
  }, [editor, publishWindowChange])

  const [copyUrlTooltipOpen, setCopyUrlTooltipOpen] = React.useState(false)

  const theRect = linkDialogState?.rectangle
  return (
    <Popover.Root open={linkDialogState.type !== 'inactive'}>
      <PopoverAnchor
        style={{
          visibility: linkDialogState.type === 'edit' ? 'visible' : 'hidden',
          top: theRect?.top,
          left: theRect?.left,
          width: theRect?.width,
          height: theRect?.height,
        }}
      />

      <Popover.Portal>
        <PopoverContent sideOffset={5} onOpenAutoFocus={(e) => e.preventDefault()} key={linkDialogState.linkNodeKey}>
          <div style={{ display: 'flex', gap: 8, alignContent: 'center', padding: 8 }}>
            {linkDialogState.type === 'edit' && (
              <>
                <LinkUIInput value={linkDialogState.url || ''} ref={inputRef} onChange={(e) => updateLinkUrl(e.target.value)} autoFocus />
                <PopoverButton onClick={() => applyLinkChanges(true)} title="Set URL" aria-label="Set URL">
                  <CheckIcon />
                </PopoverButton>

                <PopoverButton onClick={() => cancelLinkEdit(true)} title="Cancel change" aria-label="Cancel change">
                  <CloseIcon />
                </PopoverButton>
              </>
            )}

            {linkDialogState.type === 'preview' && (
              <>
                <WorkingLink href={linkDialogState.url} target="_blank" rel="noreferrer" title={linkDialogState.url}>
                  <LinkTextContainer>{linkDialogState.url}</LinkTextContainer>
                  <OpenInNewIcon />
                </WorkingLink>
                <PopoverButton onClick={() => switchFromPreviewToLinkEdit(true)} title="Edit link URL" aria-label="Edit link URL">
                  <EditIcon />
                </PopoverButton>
                <Tooltip.Provider>
                  <Tooltip.Root open={copyUrlTooltipOpen}>
                    <Tooltip.Trigger asChild>
                      <PopoverButton
                        title="Copy to clipboard"
                        aria-label="Copy link URL"
                        onClick={() => {
                          void window.navigator.clipboard.writeText(linkDialogState.url).then(() => {
                            setCopyUrlTooltipOpen(true)
                            setTimeout(() => setCopyUrlTooltipOpen(false), 1000)
                          })
                        }}
                      >
                        {copyUrlTooltipOpen ? <CheckIcon /> : <CopyIcon />}
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

                <PopoverButton title="Remove link" aria-label="Remove link" onClick={() => removeLink(true)}>
                  <LinkOffIcon />
                </PopoverButton>
              </>
            )}
          </div>
        </PopoverContent>
      </Popover.Portal>
    </Popover.Root>
  )
}
