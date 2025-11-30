/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import * as Popover from '@radix-ui/react-popover'
import * as Tooltip from '@radix-ui/react-tooltip'
import React from 'react'

import { activeEditor$, editorRootElementRef$, iconComponentFor$, useTranslation } from '../core'
import { DownshiftAutoComplete } from '../core/ui/DownshiftAutoComplete'
import styles from '@/styles/ui.module.css'
import classNames from 'classnames'
import { createCommand, LexicalCommand } from 'lexical'
import { useForm } from 'react-hook-form'
import {
  cancelLinkEdit$,
  linkAutocompleteSuggestions$,
  linkDialogState$,
  onWindowChange$,
  removeLink$,
  switchFromPreviewToLinkEdit$,
  updateLink$,
  onClickLinkCallback$,
  showLinkTitleField$
} from '.'
import { useCellValues, usePublisher } from '@mdxeditor/gurx'

export const OPEN_LINK_DIALOG: LexicalCommand<undefined> = createCommand()

interface LinkEditFormProps {
  url: string
  title: string
  text: string
  onSubmit: (link: { url: string; title: string; text: string }) => void
  onCancel: () => void
  linkAutocompleteSuggestions: string[]
  showLinkTitleField: boolean
  showAnchorTextField: boolean
}

interface LinkFormFields {
  text: string
  url: string
  title: string
}

export function LinkEditForm({
  url,
  title,
  text,
  onSubmit,
  onCancel,
  linkAutocompleteSuggestions,
  showLinkTitleField,
  showAnchorTextField
}: LinkEditFormProps) {
  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset: _
  } = useForm<LinkFormFields>({
    values: {
      url,
      title,
      text
    }
  })
  const t = useTranslation()

  return (
    <form
      onSubmit={(e) => {
        void handleSubmit(onSubmit)(e)
        e.stopPropagation()
        e.preventDefault()
      }}
      onReset={(e) => {
        e.stopPropagation()
        onCancel()
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.stopPropagation()
          onCancel()
        }
      }}
      className={classNames(styles.multiFieldForm, styles.linkDialogEditForm)}
    >
      <div className={styles.formField}>
        <label htmlFor="link-url">{t('createLink.url', 'URL')}</label>
        <DownshiftAutoComplete
          register={register}
          initialInputValue={url}
          inputName="url"
          suggestions={linkAutocompleteSuggestions}
          setValue={setValue}
          control={control}
          placeholder={t('createLink.urlPlaceholder', 'Select or paste an URL')}
          autofocus
        />
      </div>

      {showAnchorTextField ? (
        <div className={styles.formField}>
          <label htmlFor="link-text" title={t('createLink.textTooltip', 'The text to be displayed for the link')}>
            {t('createLink.text', 'Anchor text')}
          </label>
          <input id="link-text" className={styles.textInput} size={40} {...register('text')} />
        </div>
      ) : null}

      {showLinkTitleField ? (
        <div className={styles.formField}>
          <label htmlFor="link-title" title={t('createLink.titleTooltip', "The link's title attribute, shown on hover")}>
            {t('createLink.title', 'Link title')}
          </label>
          <input id="link-title" className={styles.textInput} size={40} {...register('title')} />
        </div>
      ) : null}

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-2)' }}>
        <button
          type="submit"
          title={t('createLink.saveTooltip', 'Set URL')}
          aria-label={t('createLink.saveTooltip', 'Set URL')}
          className={classNames(styles.primaryButton)}
        >
          {t('dialogControls.save', 'Save')}
        </button>
        <button
          type="reset"
          title={t('createLink.cancelTooltip', 'Cancel change')}
          aria-label={t('createLink.cancelTooltip', 'Cancel change')}
          className={classNames(styles.secondaryButton)}
        >
          {t('dialogControls.cancel', 'Cancel')}
        </button>
      </div>
    </form>
  )
}

/** @internal */
export const LinkDialog: React.FC = () => {
  const [
    editorRootElementRef,
    activeEditor,
    iconComponentFor,
    linkDialogState,
    linkAutocompleteSuggestions,
    onClickLinkCallback,
    showLinkTitleField
  ] = useCellValues(
    editorRootElementRef$,
    activeEditor$,
    iconComponentFor$,
    linkDialogState$,
    linkAutocompleteSuggestions$,
    onClickLinkCallback$,
    showLinkTitleField$
  )
  const publishWindowChange = usePublisher(onWindowChange$)
  const updateLink = usePublisher(updateLink$)
  const cancelLinkEdit = usePublisher(cancelLinkEdit$)
  const switchFromPreviewToLinkEdit = usePublisher(switchFromPreviewToLinkEdit$)
  const removeLink = usePublisher(removeLink$)

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

  const t = useTranslation()

  if (linkDialogState.type === 'inactive') return null

  const theRect = linkDialogState.rectangle

  const urlIsExternal = linkDialogState.type === 'preview' && linkDialogState.url.startsWith('http')

  return (
    <Popover.Root open={true}>
      <Popover.Anchor
        data-visible={linkDialogState.type === 'edit'}
        className={styles.linkDialogAnchor}
        style={{
          top: `${theRect.top}px`,
          left: `${theRect.left}px`,
          width: `${theRect.width}px`,
          height: `${theRect.height}px`
        }}
      />

      <Popover.Portal container={editorRootElementRef?.current}>
        <Popover.Content
          className={classNames(styles.linkDialogPopoverContent)}
          sideOffset={5}
          onOpenAutoFocus={(e) => {
            e.preventDefault()
          }}
          key={linkDialogState.linkNodeKey}
        >
          {linkDialogState.type === 'edit' && (
            <LinkEditForm
              url={linkDialogState.url}
              title={linkDialogState.title}
              text={linkDialogState.text}
              onSubmit={updateLink}
              onCancel={cancelLinkEdit.bind(null)}
              linkAutocompleteSuggestions={linkAutocompleteSuggestions}
              showLinkTitleField={showLinkTitleField}
              showAnchorTextField={linkDialogState.withAnchorText}
            />
          )}

          {linkDialogState.type === 'preview' && (
            <>
              <a
                className={styles.linkDialogPreviewAnchor}
                href={linkDialogState.url}
                {...(urlIsExternal ? { target: '_blank', rel: 'noreferrer' } : {})}
                onClick={(e) => {
                  if (onClickLinkCallback !== null) {
                    e.preventDefault()
                    onClickLinkCallback(linkDialogState.url)
                  }
                }}
                title={
                  urlIsExternal ? t('linkPreview.open', `Open {{url}} in new window`, { url: linkDialogState.url }) : linkDialogState.url
                }
              >
                <span>{linkDialogState.url}</span>
                {urlIsExternal && iconComponentFor('open_in_new')}
              </a>

              <ActionButton
                onClick={() => {
                  switchFromPreviewToLinkEdit()
                }}
                title={t('linkPreview.edit', 'Edit link URL')}
                aria-label={t('linkPreview.edit', 'Edit link URL')}
              >
                {iconComponentFor('edit')}
              </ActionButton>
              <Tooltip.Provider>
                <Tooltip.Root open={copyUrlTooltipOpen}>
                  <Tooltip.Trigger asChild>
                    <ActionButton
                      title={t('linkPreview.copyToClipboard', 'Copy to clipboard')}
                      aria-label={t('linkPreview.copyToClipboard', 'Copy to clipboard')}
                      onClick={() => {
                        void window.navigator.clipboard.writeText(linkDialogState.url).then(() => {
                          setCopyUrlTooltipOpen(true)
                          setTimeout(() => {
                            setCopyUrlTooltipOpen(false)
                          }, 1000)
                        })
                      }}
                    >
                      {copyUrlTooltipOpen ? iconComponentFor('check') : iconComponentFor('content_copy')}
                    </ActionButton>
                  </Tooltip.Trigger>
                  <Tooltip.Portal container={editorRootElementRef?.current}>
                    <Tooltip.Content className={classNames(styles.tooltipContent)} sideOffset={5}>
                      {t('linkPreview.copied', 'Copied!')}
                      <Tooltip.Arrow />
                    </Tooltip.Content>
                  </Tooltip.Portal>
                </Tooltip.Root>
              </Tooltip.Provider>

              <ActionButton
                title={t('linkPreview.remove', 'Remove link')}
                aria-label={t('linkPreview.remove', 'Remove link')}
                onClick={() => {
                  removeLink()
                }}
              >
                {iconComponentFor('link_off')}
              </ActionButton>
            </>
          )}
          <Popover.Arrow className={styles.popoverArrow} />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

const ActionButton = React.forwardRef<HTMLButtonElement, React.ComponentPropsWithoutRef<'button'>>(({ className, ...props }, ref) => {
  return <button className={classNames(styles.actionButton, className)} ref={ref} {...props} />
})
