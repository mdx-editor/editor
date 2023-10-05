/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import * as Popover from '@radix-ui/react-popover'
import * as Tooltip from '@radix-ui/react-tooltip'
import React from 'react'

import { createCommand, LexicalCommand } from 'lexical'
import CheckIcon from '../../icons/check.svg'
import CopyIcon from '../../icons/content_copy.svg'
import EditIcon from '../../icons/edit.svg'
import LinkOffIcon from '../../icons/link_off.svg'
import OpenInNewIcon from '../../icons/open_in_new.svg'
import classNames from 'classnames'
import styles from '../../styles/ui.module.css'
import { corePluginHooks } from '../core'
import { linkDialogPluginHooks } from '.'
import { useForm } from 'react-hook-form'
import { DownshiftAutoComplete } from '../core/ui/DownshiftAutoComplete'

export const OPEN_LINK_DIALOG: LexicalCommand<undefined> = createCommand()

interface LinkEditFormProps {
  url: string
  title: string
  onSubmit: (link: { url: string; title: string }) => void
  onCancel: () => void
  linkAutocompleteSuggestions: string[]
}

interface LinkFormFields {
  url: string
  title: string
}

export function LinkEditForm({ url, title, onSubmit, onCancel, linkAutocompleteSuggestions }: LinkEditFormProps) {
  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset: _
  } = useForm<LinkFormFields>({
    values: {
      url,
      title
    }
  })

  return (
    <form
      onSubmit={(e) => {
        void handleSubmit(onSubmit)(e)
        e.stopPropagation()
        e.preventDefault()
      }}
      onReset={onCancel}
      className={classNames(styles.multiFieldForm, styles.linkDialogEditForm)}
    >
      <div className={styles.formField}>
        <label htmlFor="link-url">URL</label>
        <DownshiftAutoComplete
          initialInputValue={url}
          inputName="url"
          suggestions={linkAutocompleteSuggestions}
          setValue={setValue}
          control={control}
          placeholder="Select or paste an URL"
          autofocus
        />
      </div>

      <div className={styles.formField}>
        <label htmlFor="link-title">Title</label>
        <input id="link-title" className={styles.textInput} size={40} {...register('title')} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-2)' }}>
        <button type="submit" title="Set URL" aria-label="Set URL" className={classNames(styles.primaryButton)}>
          Save
        </button>
        <button type="reset" title="Cancel change" aria-label="Cancel change" className={classNames(styles.secondaryButton)}>
          Cancel
        </button>
      </div>
    </form>
  )
}

export const LinkDialog: React.FC = () => {
  const [editorRootElementRef] = corePluginHooks.useEmitterValues('editorRootElementRef')
  const publishWindowChange = linkDialogPluginHooks.usePublisher('onWindowChange')
  const [activeEditor] = corePluginHooks.useEmitterValues('activeEditor')

  const [linkDialogState, linkAutocompleteSuggestions] = linkDialogPluginHooks.useEmitterValues(
    'linkDialogState',
    'linkAutocompleteSuggestions'
  )
  const updateLink = linkDialogPluginHooks.usePublisher('updateLink')
  const cancelLinkEdit = linkDialogPluginHooks.usePublisher('cancelLinkEdit')
  const switchFromPreviewToLinkEdit = linkDialogPluginHooks.usePublisher('switchFromPreviewToLinkEdit')
  const removeLink = linkDialogPluginHooks.usePublisher('removeLink')

  React.useEffect(() => {
    const update = () => {
      activeEditor?.getEditorState().read(() => {
        publishWindowChange(true)
      })
    }

    window.addEventListener('resize', update)
    window.addEventListener('scroll', update)

    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update)
    }
  }, [activeEditor, publishWindowChange])

  const [copyUrlTooltipOpen, setCopyUrlTooltipOpen] = React.useState(false)

  const theRect = linkDialogState?.rectangle

  const urlIsExternal = linkDialogState.type === 'preview' && linkDialogState.url.startsWith('http')

  return (
    <Popover.Root open={linkDialogState.type !== 'inactive'}>
      <Popover.Anchor
        data-visible={linkDialogState.type === 'edit'}
        className={styles.linkDialogAnchor}
        style={{
          top: theRect?.top,
          left: theRect?.left,
          width: theRect?.width,
          height: theRect?.height
        }}
      />

      <Popover.Portal container={editorRootElementRef?.current}>
        <Popover.Content
          className={classNames(styles.linkDialogPopoverContent)}
          sideOffset={5}
          onOpenAutoFocus={(e) => e.preventDefault()}
          key={linkDialogState.linkNodeKey}
        >
          {linkDialogState.type === 'edit' && (
            <LinkEditForm
              url={linkDialogState.url}
              title={linkDialogState.title}
              onSubmit={updateLink}
              onCancel={cancelLinkEdit.bind(null, true)}
              linkAutocompleteSuggestions={linkAutocompleteSuggestions}
            />
          )}

          {linkDialogState.type === 'preview' && (
            <>
              <a
                className={styles.linkDialogPreviewAnchor}
                href={linkDialogState.url}
                {...(urlIsExternal ? { target: '_blank', rel: 'noreferrer' } : {})}
                title={urlIsExternal ? `Open ${linkDialogState.url} in new window` : linkDialogState.url}
              >
                <span>{linkDialogState.url}</span>
                {urlIsExternal && <OpenInNewIcon />}
              </a>
              <ActionButton onClick={() => switchFromPreviewToLinkEdit(true)} title="Edit link URL" aria-label="Edit link URL">
                <EditIcon />
              </ActionButton>
              <Tooltip.Provider>
                <Tooltip.Root open={copyUrlTooltipOpen}>
                  <Tooltip.Trigger asChild>
                    <ActionButton
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
                    </ActionButton>
                  </Tooltip.Trigger>
                  <Tooltip.Portal container={editorRootElementRef?.current}>
                    <Tooltip.Content className={classNames(styles.tooltipContent)} sideOffset={5}>
                      Copied!
                      <Tooltip.Arrow />
                    </Tooltip.Content>
                  </Tooltip.Portal>
                </Tooltip.Root>
              </Tooltip.Provider>

              <ActionButton title="Remove link" aria-label="Remove link" onClick={() => removeLink(true)}>
                <LinkOffIcon />
              </ActionButton>
            </>
          )}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

const ActionButton = React.forwardRef<HTMLButtonElement, React.ComponentPropsWithoutRef<'button'>>(({ className, ...props }, ref) => {
  return <button className={classNames(styles.actionButton, className)} ref={ref} {...props} />
})
