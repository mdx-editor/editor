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
import DropDownIcon from '../../icons/arrow_drop_down.svg'
import classNames from 'classnames'
import { useCombobox } from 'downshift'
import styles from '../../styles/ui.module.css'
import { corePluginHooks } from '../core'
import { linkDialogPluginHooks } from '.'

export const OPEN_LINK_DIALOG: LexicalCommand<undefined> = createCommand()

interface LinkEditFormProps {
  initialUrl: string
  initialTitle: string
  onSubmit: (link: [string, string]) => void
  onCancel: () => void
  linkAutocompleteSuggestions: string[]
}

const MAX_SUGGESTIONS = 20

export function LinkEditForm({ initialUrl, initialTitle, onSubmit, onCancel, linkAutocompleteSuggestions }: LinkEditFormProps) {
  const [items, setItems] = React.useState(linkAutocompleteSuggestions.slice(0, MAX_SUGGESTIONS))
  const [title, setTitle] = React.useState(initialTitle)

  const { isOpen, getToggleButtonProps, getMenuProps, getInputProps, highlightedIndex, getItemProps, selectedItem, inputValue } =
    useCombobox({
      initialInputValue: initialUrl,
      onInputValueChange({ inputValue }) {
        inputValue = inputValue?.toLowerCase() || ''
        const matchingItems = []
        for (const url of linkAutocompleteSuggestions) {
          if (url.toLowerCase().includes(inputValue)) {
            matchingItems.push(url)
            if (matchingItems.length >= MAX_SUGGESTIONS) {
              break
            }
          }
        }
        setItems(matchingItems)
      },
      items,
      itemToString(item) {
        return item ?? ''
      }
    })

  const onSubmitEH = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit([inputValue, title])
  }

  const onKeyDownEH = React.useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Escape') {
        ;(e.target as HTMLInputElement).form?.reset()
      } else if (e.key === 'Enter' && (!isOpen || items.length === 0)) {
        e.preventDefault()
        onSubmit([(e.target as HTMLInputElement).value, title])
      }
    },
    [isOpen, items, onSubmit, title]
  )

  const handleSaveClick = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    event.stopPropagation()
  }

  const downshiftInputProps = getInputProps()

  const inputProps = {
    ...downshiftInputProps,
    onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => {
      onKeyDownEH(e)
      downshiftInputProps.onKeyDown(e)
    }
  }

  const dropdownIsVisible = isOpen && items.length > 0

  return (
    <form onSubmit={onSubmitEH} onReset={onCancel} className={classNames(styles.linkDialogEditForm)}>
      <div>
        <label htmlFor="link-url">URL</label>
      </div>
      <div className={styles.linkDialogInputContainer}>
        <div data-visible-dropdown={dropdownIsVisible} className={styles.linkDialogInputWrapper}>
          <input id="link-url" className={styles.linkDialogInput} {...inputProps} autoFocus size={40} data-editor-dialog={true} />
          <button aria-label="toggle menu" type="button" {...getToggleButtonProps()}>
            <DropDownIcon />
          </button>
        </div>

        <div className={styles.downshiftAutocompleteContainer}>
          <ul {...getMenuProps()} data-visible={dropdownIsVisible}>
            {items.map((item, index: number) => (
              <li
                data-selected={selectedItem === item}
                data-highlighted={highlightedIndex === index}
                key={`${item}${index}`}
                {...getItemProps({ item, index })}
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div>
        <label htmlFor="link-title">Title</label>
      </div>
      <div>
        <div className={styles.linkDialogInputWrapper}>
          <input id="link-title" className={styles.linkDialogInput} size={40} value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-2)' }}>
        <button type="reset" title="Cancel change" aria-label="Cancel change" className={classNames(styles.secondaryButton)}>
          Cancel
        </button>
        <button type="submit" title="Set URL" aria-label="Set URL" className={classNames(styles.primaryButton)} onClick={handleSaveClick}>
          Save
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
  const updateLinkUrl = linkDialogPluginHooks.usePublisher('updateLinkUrl')
  const cancelLinkEdit = linkDialogPluginHooks.usePublisher('cancelLinkEdit')
  const switchFromPreviewToLinkEdit = linkDialogPluginHooks.usePublisher('switchFromPreviewToLinkEdit')
  const removeLink = linkDialogPluginHooks.usePublisher('removeLink')
  const applyLinkChanges = linkDialogPluginHooks.usePublisher('applyLinkChanges')

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

  const onSubmitEH = React.useCallback(
    (payload: [string, string]) => {
      updateLinkUrl(payload)
      applyLinkChanges(true)
    },
    [applyLinkChanges, updateLinkUrl]
  )

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
              initialUrl={linkDialogState.url}
              initialTitle={linkDialogState.title}
              onSubmit={onSubmitEH}
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
