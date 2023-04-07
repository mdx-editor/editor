import * as Popover from '@radix-ui/react-popover'
import * as Tooltip from '@radix-ui/react-tooltip'
import React from 'react'

import { createCommand, LexicalCommand } from 'lexical'
import { useEmitterValues, usePublisher } from '../../system'
import { PopoverAnchor, PopoverContent } from '../Popover/primitives'
import { ReactComponent as CheckIcon } from './icons/check.svg'
import { ReactComponent as CloseIcon } from './icons/close.svg'
import { ReactComponent as CopyIcon } from './icons/content_copy.svg'
import { ReactComponent as EditIcon } from './icons/edit.svg'
import { ReactComponent as LinkOffIcon } from './icons/link_off.svg'
import { ReactComponent as OpenInNewIcon } from './icons/open_in_new.svg'
import { LinkTextContainer, LinkUIInput, PopoverButton, TooltipArrow, TooltipContent, WorkingLink } from './primitives'
import { useForm } from 'react-hook-form'

export const OPEN_LINK_DIALOG: LexicalCommand<undefined> = createCommand()

interface LinkEditFormProps {
  initialUrl: string
  onSubmit: (url: string) => void
  onCancel: () => void
}

function LinkEditForm({ initialUrl, onSubmit, onCancel }: LinkEditFormProps) {
  const { register, handleSubmit } = useForm<{ url: string }>({
    defaultValues: {
      url: initialUrl,
    },
  })

  const onSubmitEH = handleSubmit((data) => {
    onSubmit(data.url)
  })

  const onKeyDownEH = React.useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      ;(e.target as HTMLInputElement).form?.reset()
    }
  }, [])

  return (
    <form onSubmit={onSubmitEH} onReset={onCancel}>
      <LinkUIInput {...register('url')} onKeyDown={onKeyDownEH} autoFocus />

      <PopoverButton type="submit" title="Set URL" aria-label="Set URL">
        <CheckIcon />
      </PopoverButton>

      <PopoverButton type="reset" title="Cancel change" aria-label="Cancel change">
        <CloseIcon />
      </PopoverButton>
    </form>
  )
}

export function LinkDialogPlugin() {
  const publishWindowChange = usePublisher('onWindowChange')
  const [linkDialogState, activeEditor] = useEmitterValues('linkDialogState', 'activeEditor')
  const updateLinkUrl = usePublisher('updateLinkUrl')
  const cancelLinkEdit = usePublisher('cancelLinkEdit')
  const switchFromPreviewToLinkEdit = usePublisher('switchFromPreviewToLinkEdit')
  const removeLink = usePublisher('removeLink')
  const applyLinkChanges = usePublisher('applyLinkChanges')

  React.useEffect(() => {
    const update = (e) => {
      console.log(e)
      activeEditor?.getEditorState().read(() => {
        publishWindowChange(true)
      })
    }

    window.addEventListener('resize', update)
    // TODO: get the right scroller
    window.addEventListener('scroll', update)

    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update)
    }
  }, [activeEditor, publishWindowChange])

  const [copyUrlTooltipOpen, setCopyUrlTooltipOpen] = React.useState(false)

  const theRect = linkDialogState?.rectangle

  const onSubmitEH = React.useCallback(
    (url: string) => {
      updateLinkUrl(url)
      applyLinkChanges(true)
    },
    [applyLinkChanges, updateLinkUrl]
  )

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
              <LinkEditForm initialUrl={linkDialogState.url} onSubmit={onSubmitEH} onCancel={cancelLinkEdit.bind(null, true)} />
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
