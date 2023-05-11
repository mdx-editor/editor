/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import * as Popover from '@radix-ui/react-popover'
import * as Tooltip from '@radix-ui/react-tooltip'
import React from 'react'

import { createCommand, LexicalCommand } from 'lexical'
import { useEmitterValues, usePublisher } from '../../system'
import { ReactComponent as CheckIcon } from './icons/check.svg'
import { ReactComponent as CloseIcon } from './icons/close.svg'
import { ReactComponent as CopyIcon } from './icons/content_copy.svg'
import { ReactComponent as EditIcon } from './icons/edit.svg'
import { ReactComponent as LinkOffIcon } from './icons/link_off.svg'
import { ReactComponent as OpenInNewIcon } from './icons/open_in_new.svg'
import { ReactComponent as DropDownIcon } from './icons/arrow_drop_down.svg'
import classNames from 'classnames'
import { buttonClasses } from '../commonCssClasses'
import { useCombobox } from 'downshift'

export const OPEN_LINK_DIALOG: LexicalCommand<undefined> = createCommand()

interface LinkEditFormProps {
  initialUrl: string
  onSubmit: (url: string) => void
  onCancel: () => void
  linkAutocompleteSuggestions: string[]
}

const MAX_SUGGESTIONS = 20

export function LinkEditForm({ initialUrl, onSubmit, onCancel, linkAutocompleteSuggestions }: LinkEditFormProps) {
  const [items, setItems] = React.useState(linkAutocompleteSuggestions.slice(0, MAX_SUGGESTIONS))

  const { isOpen, getToggleButtonProps, getMenuProps, getInputProps, highlightedIndex, getItemProps, selectedItem } = useCombobox({
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
    },
  })

  const onSubmitEH = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(selectedItem || '')
  }

  const onKeyDownEH = React.useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Escape') {
        ;(e.target as HTMLInputElement).form?.reset()
      } else if (e.key === 'Enter' && (!isOpen || items.length === 0)) {
        e.preventDefault()
        onSubmit((e.target as HTMLInputElement).value)
      }
    },
    [isOpen, items, onSubmit]
  )

  const downshiftInputProps = getInputProps()

  const inputProps = {
    ...downshiftInputProps,
    onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => {
      onKeyDownEH(e)
      downshiftInputProps.onKeyDown(e)
    },
  }

  const dropdownIsVisible = isOpen && items.length > 0

  return (
    <form onSubmit={onSubmitEH} onReset={onCancel} className="flex ">
      <div className="flex flex-col items-stretch">
        <div
          data-visible-dropdown={dropdownIsVisible}
          className="rounded-md border-2 flex items-center border-primary-100 border-solid data-[visible-dropdown=true]:rounded-b-none data-[visible-dropdown=true]:border-b-0 bg-white"
        >
          <input className="py-1 px-2 pr-1 text-sm font-sans focus:outline-none" {...inputProps} autoFocus size={30} />
          <button aria-label="toggle menu" className="px-1" type="button" {...getToggleButtonProps()}>
            <DropDownIcon />
          </button>
        </div>

        <div className="relative">
          <ul
            {...getMenuProps()}
            data-visible={dropdownIsVisible}
            className={classNames(
              'absolute text-sm w-full hidden data-[visible=true]:block rounded-b-md max-h-48 overflow-x-hidden overflow-y-auto border-2 border-primary-100 border-t-0 bg-white'
            )}
          >
            {items.map((item, index: number) => (
              <li
                data-selected={selectedItem === item}
                data-highlighted={highlightedIndex === index}
                className="data-[selected=true]:bg-primary-200 data-[highlighted=true]:bg-primary-100 p-1 last:rounded-b-md whitespace-nowrap pl-1 mb-1 overflow-x-hidden text-ellipsis"
                key={`${item}${index}`}
                {...getItemProps({ item, index })}
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <ActionButton type="submit" title="Set URL" aria-label="Set URL">
        <CheckIcon />
      </ActionButton>

      <ActionButton type="reset" title="Cancel change" aria-label="Cancel change">
        <CloseIcon />
      </ActionButton>
    </form>
  )
}

export function LinkDialogPlugin() {
  const publishWindowChange = usePublisher('onWindowChange')
  const [linkDialogState, linkAutocompleteSuggestions, activeEditor] = useEmitterValues(
    'linkDialogState',
    'linkAutocompleteSuggestions',
    'activeEditor'
  )
  const updateLinkUrl = usePublisher('updateLinkUrl')
  const cancelLinkEdit = usePublisher('cancelLinkEdit')
  const switchFromPreviewToLinkEdit = usePublisher('switchFromPreviewToLinkEdit')
  const removeLink = usePublisher('removeLink')
  const applyLinkChanges = usePublisher('applyLinkChanges')

  React.useEffect(() => {
    const update = () => {
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
      <Popover.Anchor
        data-visible={linkDialogState.type === 'edit'}
        className='data-[visible="true"]:visible data-[visible=false]:invisible absolute bg-[highlight] z-[-1]'
        style={{
          top: theRect?.top,
          left: theRect?.left,
          width: theRect?.width,
          height: theRect?.height,
        }}
      />

      <Popover.Portal>
        <Popover.Content
          className="flex flex-row items-center gap-0.5 rounded-md border-2 border-solid border-surface-50 bg-popoverBg px-4 py-2 pr-3 font-sans text-sm shadow-sm shadow-surface-200"
          sideOffset={5}
          onOpenAutoFocus={(e) => e.preventDefault()}
          key={linkDialogState.linkNodeKey}
        >
          {linkDialogState.type === 'edit' && (
            <LinkEditForm
              initialUrl={linkDialogState.url}
              onSubmit={onSubmitEH}
              onCancel={cancelLinkEdit.bind(null, true)}
              linkAutocompleteSuggestions={linkAutocompleteSuggestions}
            />
          )}

          {linkDialogState.type === 'preview' && (
            <>
              <a
                className="mr-3 pl-2 flex flex-row items-center text-primary-600 no-underline [&_svg]:w-5 [&_svg]:h-5 border-transparent border-solid border-1"
                href={linkDialogState.url}
                target="_blank"
                rel="noreferrer"
                title={linkDialogState.url}
              >
                <span className="max-w-[10rem] overflow-hidden text-ellipsis whitespace-nowrap">{linkDialogState.url}</span>
                <OpenInNewIcon className="ml-2" />
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
                  <Tooltip.Portal>
                    <Tooltip.Content
                      className="rounded-md bg-slate-700 p-1 px-2 font-sans text-xs text-slate-50 data-[state=delayed-open]:data-[side=bottom]:animate-slideUpAndFade data-[state=delayed-open]:data-[side=left]:animate-slideRightAndFade data-[state=delayed-open]:data-[side=right]:animate-slideLeftAndFade data-[state=delayed-open]:data-[side=top]:animate-slideDownAndFade"
                      sideOffset={5}
                    >
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
  return <button className={classNames(buttonClasses, className, '[&_svg]:w-5 [&_svg]:h-5')} ref={ref} {...props} />
})
