import * as Dialog from '@radix-ui/react-dialog'
import * as RadixToolbar from '@radix-ui/react-toolbar'
import { useEmitterValues } from '../../system/EditorSystemComponent'

import React from 'react'

import classNames from 'classnames'
import { useCombobox } from 'downshift'
import DropDownIcon from '../icons/arrow_drop_down.svg'
import CheckIcon from '../icons/check.svg'
import CloseIcon from '../icons/close.svg'
import styles from '../styles.module.css'
import { InstantTooltip } from './InstantTooltip'

export interface DialogButtonProps {
  autocompleteSuggestions?: string[]
  onSubmit: (value: string) => void
  tooltipTitle: string
  buttonContent?: React.ReactNode
  dialogInputPlaceholder: string
  submitButtonTitle: string
}

// TODO: make this configurable
const MAX_SUGGESTIONS = 20

export const DialogButton = React.forwardRef<HTMLButtonElement, DialogButtonProps>(
  ({ autocompleteSuggestions = [], submitButtonTitle, dialogInputPlaceholder, onSubmit, tooltipTitle, buttonContent }, forwardedRef) => {
    const [editorRootElementRef] = useEmitterValues('editorRootElementRef')
    const [open, setOpen] = React.useState(false)

    const onSubmitCallback = React.useCallback(
      (value: string) => {
        onSubmit(value)
        setOpen(false)
      },
      [onSubmit]
    )

    return (
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Trigger asChild>
          <RadixToolbar.Button className={styles.toolbarButton} ref={forwardedRef}>
            <InstantTooltip title={tooltipTitle}>{buttonContent}</InstantTooltip>
          </RadixToolbar.Button>
        </Dialog.Trigger>
        <Dialog.Portal container={editorRootElementRef!.current}>
          <Dialog.Overlay className={styles.dialogOverlay} />
          <Dialog.Content className={styles.dialogContent}>
            <DialogForm
              submitButtonTitle={submitButtonTitle}
              autocompleteSuggestions={autocompleteSuggestions}
              onSubmitCallback={onSubmitCallback}
              dialogInputPlaceholder={dialogInputPlaceholder}
            />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    )
  }
)

const DialogForm: React.FC<{
  submitButtonTitle: string
  autocompleteSuggestions: string[]
  dialogInputPlaceholder: string
  onSubmitCallback: (value: string) => void
}> = ({ autocompleteSuggestions, onSubmitCallback, dialogInputPlaceholder, submitButtonTitle }) => {
  const [items, setItems] = React.useState(autocompleteSuggestions.slice(0, MAX_SUGGESTIONS))

  const enableAutoComplete = autocompleteSuggestions.length > 0

  const { isOpen, getToggleButtonProps, getMenuProps, getInputProps, highlightedIndex, getItemProps, selectedItem } = useCombobox({
    initialInputValue: '',
    onInputValueChange({ inputValue }) {
      inputValue = inputValue?.toLowerCase() || ''
      const matchingItems = []
      for (const suggestion of autocompleteSuggestions) {
        if (suggestion.toLowerCase().includes(inputValue)) {
          matchingItems.push(suggestion)
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
    onSubmitCallback(selectedItem || '')
  }

  const onKeyDownEH = React.useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Escape') {
        ;(e.target as HTMLInputElement).form?.reset()
      } else if (e.key === 'Enter' && (!isOpen || items.length === 0)) {
        e.preventDefault()
        onSubmitCallback((e.target as HTMLInputElement).value)
      }
    },
    [isOpen, items, onSubmitCallback]
  )

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const downshiftInputProps = getInputProps()

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const inputProps = {
    ...downshiftInputProps,
    onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => {
      onKeyDownEH(e)
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      downshiftInputProps.onKeyDown(e)
    }
  }

  const dropdownIsVisible = isOpen && items.length > 0
  return (
    <form onSubmit={onSubmitEH} className={classNames(styles.linkDialogEditForm)}>
      <div className={styles.linkDialogInputContainer}>
        <div data-visible-dropdown={dropdownIsVisible} className={styles.linkDialogInputWrapper}>
          <input
            placeholder={dialogInputPlaceholder}
            className={styles.linkDialogInput}
            {...inputProps}
            autoFocus
            size={30}
            data-editor-dialog={true}
          />
          {enableAutoComplete && (
            <button aria-label="toggle menu" type="button" {...getToggleButtonProps()}>
              <DropDownIcon />
            </button>
          )}
        </div>

        <div className={styles.linkDialogAutocompleteContainer}>
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

      <button
        type="submit"
        title={submitButtonTitle}
        aria-label={submitButtonTitle}
        className={classNames(styles.actionButton, styles.primaryActionButton)}
      >
        <CheckIcon />
      </button>

      <Dialog.Close className={styles.actionButton}>
        <CloseIcon />
      </Dialog.Close>
    </form>
  )
}
