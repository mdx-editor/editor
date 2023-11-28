import * as Dialog from '@radix-ui/react-dialog'
import * as RadixToolbar from '@radix-ui/react-toolbar'

import React from 'react'

import classNames from 'classnames'
import { useCombobox } from 'downshift'
import DropDownIcon from '../../../icons/arrow_drop_down.svg'
import CheckIcon from '../../../icons/check.svg'
import CloseIcon from '../../../icons/close.svg'
import { corePluginHooks } from '../../core'
import styles from '../../../styles/ui.module.css'
import { TooltipWrap } from './TooltipWrap'

/**
 * The properties of the {@link DialogButton} component.
 */
export interface DialogButtonProps {
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

const MAX_SUGGESTIONS = 20

interface PropVariable {
  autocompleteSuggestions: never[]
  submitButtonTitle: any
  dialogInputPlaceholder: any
  onSubmit: any
  tooltipTitle: any
  buttonContent: any

}

/**
 * Use this primitive to create a toolbar button that opens a dialog with a text input, autocomplete suggestions, and a submit button.
 *
 * See {@link DialogButtonProps} for the properties that can be passed to this component.
 */
export const DialogButton = React.forwardRef<HTMLButtonElement, DialogButtonProps>(
  (props: PropVariable, forwardedRef) => {
    const [editorRootElementRef, readOnly] = corePluginHooks.useEmitterValues('editorRootElementRef', 'readOnly')
    const [open, setOpen] = React.useState(false)

    const onSubmitCallback = React.useCallback(
      (value: string) => {
        props.onSubmit(value)
        setOpen(false)
      },
      [props.onSubmit]
    )

    return (
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Trigger asChild>
          <RadixToolbar.Button className={styles.toolbarButton} ref={forwardedRef} disabled={readOnly}>
            <TooltipWrap title={props.tooltipTitle}>{props.buttonContent}</TooltipWrap>
          </RadixToolbar.Button>
        </Dialog.Trigger>
        <Dialog.Portal container={editorRootElementRef?.current}>
          <Dialog.Overlay className={styles.dialogOverlay} />
          <Dialog.Content className={styles.dialogContent}>
            <DialogForm
              submitButtonTitle={props.submitButtonTitle}
              autocompleteSuggestions={props.autocompleteSuggestions}
              onSubmitCallback={onSubmitCallback}
              dialogInputPlaceholder={props.dialogInputPlaceholder}
            />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    )
  }
)

interface DialogProp {
  submitButtonTitle: string
  autocompleteSuggestions: string[]
  dialogInputPlaceholder: string
  onSubmitCallback: (value: string) => void
}

const DialogForm: React.FC<DialogProp> = (props) => {
  const [items, setItems] = React.useState(props.autocompleteSuggestions.slice(0, MAX_SUGGESTIONS))

  const enableAutoComplete = props.autocompleteSuggestions.length > 0

  const useComboboxVariable = useCombobox({
    initialInputValue: '',
    onInputValueChange({ inputValue }) {
      inputValue = inputValue?.toLowerCase() || ''
      const matchingItems = []
      for (const suggestion of props.autocompleteSuggestions) {
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
      } else if (e.key === 'Enter' && (!useComboboxVariable.isOpen || items.length === 0)) {
        e.preventDefault()
        props.onSubmitCallback((e.target as HTMLInputElement).value)
      }
    },
    [useComboboxVariable.isOpen, items, props.onSubmitCallback]
  )

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const downshiftInputProps = useComboboxVariable.getInputProps()

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
    props.onSubmitCallback((inputProps as { value: string }).value)
  }

  const dropdownIsVisible = useComboboxVariable.isOpen && items.length > 0
  return (
    <form onSubmit={onSubmitEH} className={classNames(styles.dialogForm)}>
      <div className={styles.linkDialogInputContainer}>
        <div data-visible-dropdown={dropdownIsVisible} className={styles.linkDialogInputWrapper}>
          <input
            placeholder={props.dialogInputPlaceholder}
            className={styles.linkDialogInput}
            {...inputProps}
            autoFocus
            size={30}
            data-editor-dialog={true}
          />
          {enableAutoComplete && (
            <button aria-label="toggle menu" type="button" {...useComboboxVariable.getToggleButtonProps()}>
              <DropDownIcon />
            </button>
          )}
        </div>

        <div className={styles.downshiftAutocompleteContainer}>
          <ul {...useComboboxVariable.getMenuProps()} data-visible={dropdownIsVisible}>
            {items.map((item, index: number) => (
              <li
                data-selected={useComboboxVariable.selectedItem === item}
                data-highlighted={useComboboxVariable.highlightedIndex === index}
                key={`${item}${index}`}
                {...useComboboxVariable.getItemProps({ item, index })}
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <button
        type="submit"
        title={props.submitButtonTitle}
        aria-label={props.submitButtonTitle}
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
