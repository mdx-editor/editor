import * as Dialog from '@radix-ui/react-dialog'
import * as RadixToolbar from '@radix-ui/react-toolbar'

import React from 'react'

import classNames from 'classnames'
import { useCombobox } from 'downshift'
import { editorRootElementRef$, iconComponentFor$, readOnly$ } from '../../core'
import styles from '../../../styles/ui.module.css'
import { TooltipWrap } from './TooltipWrap'
import { useCellValue, useCellValues } from '@mdxeditor/gurx'

const MAX_SUGGESTIONS = 20

/**
 * Use this primitive to create a toolbar button that opens a dialog with a text input, autocomplete suggestions, and a submit button.
 * @group Toolbar Primitives
 */
export const DialogButton = React.forwardRef<
  HTMLButtonElement,
  {
    /**
     * The autocomplete suggestions to show in the dialog input.
     */
    autocompleteSuggestions?: string[]
    /**
     * The callback to call when the dialog is submitted. The callback receives the value of the text input as a parameter.
     */
    onSubmit: (value: string) => void
    /**
     * The title to show in the tooltip of the toolbar button.
     */
    tooltipTitle: string
    /**
     * The contents of the button. Usually an icon.
     * @example
     * ```tsx
     * <DialogButton buttonContent={<CustomIcon />} />
     * ```
     */
    buttonContent?: React.ReactNode
    /**
     * The placeholder text to show in the dialog input.
     */
    dialogInputPlaceholder: string
    /**
     * The title of the submit button.
     */
    submitButtonTitle: string
  }
>(({ autocompleteSuggestions = [], submitButtonTitle, dialogInputPlaceholder, onSubmit, tooltipTitle, buttonContent }, forwardedRef) => {
  const [editorRootElementRef, readOnly] = useCellValues(editorRootElementRef$, readOnly$)
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
        <RadixToolbar.Button className={styles.toolbarButton} ref={forwardedRef} disabled={readOnly}>
          <TooltipWrap title={tooltipTitle}>{buttonContent}</TooltipWrap>
        </RadixToolbar.Button>
      </Dialog.Trigger>
      <Dialog.Portal container={editorRootElementRef?.current}>
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
})

const DialogForm: React.FC<{
  submitButtonTitle: string
  autocompleteSuggestions: string[]
  dialogInputPlaceholder: string
  onSubmitCallback: (value: string) => void
}> = ({ autocompleteSuggestions, onSubmitCallback, dialogInputPlaceholder, submitButtonTitle }) => {
  const [items, setItems] = React.useState(autocompleteSuggestions.slice(0, MAX_SUGGESTIONS))
  const iconComponentFor = useCellValue(iconComponentFor$)

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

  const onSubmitEH = (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onSubmitCallback((inputProps as { value: string }).value)
  }

  const dropdownIsVisible = isOpen && items.length > 0
  return (
    <form onSubmit={onSubmitEH} className={classNames(styles.dialogForm)}>
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
              {iconComponentFor('arrow_drop_down')}
            </button>
          )}
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

      <button
        type="submit"
        title={submitButtonTitle}
        aria-label={submitButtonTitle}
        className={classNames(styles.actionButton, styles.primaryActionButton)}
      >
        {iconComponentFor('check')}
      </button>

      <Dialog.Close className={styles.actionButton}>{iconComponentFor('close')}</Dialog.Close>
    </form>
  )
}
