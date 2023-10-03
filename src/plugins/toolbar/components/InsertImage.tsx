/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import React from 'react'
import { imagePluginHooks } from '../../image'
import * as RadixToolbar from '@radix-ui/react-toolbar'
import * as Dialog from '@radix-ui/react-dialog'
import AddPhotoIcon from '../../../icons/add_photo.svg'
import styles from '../../../styles/ui.module.css'
import { corePluginHooks } from '../../core/index'
import { TooltipWrap } from '../primitives/TooltipWrap'
import { useCombobox } from 'downshift'
import classNames from 'classnames'
import DropDownIcon from '../../../icons/arrow_drop_down.svg'
import { useForm, Controller, Control } from 'react-hook-form'

interface ImageFormFields {
  src?: string
  title: string
  altText?: string
  file?: File
}

const MAX_SUGGESTIONS = 20
/**
 * A toolbar button that allows the user to insert an image from an URL.
 * For the button to work, you need to have the `imagePlugin` plugin enabled.
 */
export const InsertImage = React.forwardRef<HTMLButtonElement, Record<string, never>>((_, forwardedRef) => {
  const [imageAutocompleteSuggestions] = imagePluginHooks.useEmitterValues('imageAutocompleteSuggestions')
  const insertImage = imagePluginHooks.usePublisher('insertImage')
  const [editorRootElementRef, readOnly] = corePluginHooks.useEmitterValues('editorRootElementRef', 'readOnly')
  const [open, setOpen] = React.useState(false)
  const { register, handleSubmit, control } = useForm<ImageFormFields>()

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <RadixToolbar.Button className={styles.toolbarButton} ref={forwardedRef} disabled={readOnly}>
          <TooltipWrap title="Insert image">
            <AddPhotoIcon />
          </TooltipWrap>
        </RadixToolbar.Button>
      </Dialog.Trigger>
      <Dialog.Portal container={editorRootElementRef?.current}>
        <Dialog.Overlay className={styles.dialogOverlay} />
        <Dialog.Content className={styles.dialogContent} onOpenAutoFocus={(e) => e.preventDefault()}>
          <form
            onSubmit={handleSubmit((data) => {
              insertImage(data)
              setOpen(false)
            })}
            className={styles.multiFieldForm}
          >
            <div className={styles.formField}>
              <label htmlFor="file">Upload an image from your device:</label>
              <input type="file" {...register('file')} />
            </div>

            <div className={styles.formField}>
              <label htmlFor="src">Or add an image from an URL:</label>
              <DownshiftAutoComplete
                inputName="src"
                suggestions={imageAutocompleteSuggestions}
                control={control}
                placeholder="Select or paste an image src"
              />
            </div>

            <div className={styles.formField}>
              <label htmlFor="alt">Alt:</label>
              <input type="text" {...register('altText')} className={styles.textInput} />
            </div>

            <div className={styles.formField}>
              <label htmlFor="title">Title:</label>
              <input type="text" {...register('title')} className={styles.textInput} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-2)' }}>
              <Dialog.Close className={styles.actionButton} asChild>
                <button type="reset" title="Cancel change" aria-label="Cancel change" className={classNames(styles.secondaryButton)}>
                  Cancel
                </button>
              </Dialog.Close>
              <button type="submit" title="Set URL" aria-label="Set URL" className={classNames(styles.primaryButton)}>
                Save
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
})

const DownshiftAutoComplete: React.FC<{ suggestions: string[]; control: Control<any, any>; placeholder: string; inputName: string }> = ({
  suggestions,
  control,
  inputName,
  placeholder
}) => {
  const [items, setItems] = React.useState(suggestions.slice(0, MAX_SUGGESTIONS))

  const enableAutoComplete = suggestions.length > 0

  const { isOpen, getToggleButtonProps, getMenuProps, getInputProps, highlightedIndex, getItemProps, selectedItem } = useCombobox({
    initialInputValue: '',
    onInputValueChange({ inputValue }) {
      inputValue = inputValue?.toLowerCase() || ''
      const matchingItems = []
      for (const suggestion of suggestions) {
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

  const dropdownIsVisible = isOpen && items.length > 0
  return (
    <div className={styles.downshiftAutocompleteContainer}>
      <div data-visible-dropdown={dropdownIsVisible} className={styles.downshiftInputWrapper}>
        <Controller
          name={inputName}
          control={control}
          render={({ field }) => {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const downshiftSrcProps = getInputProps({
              onSelect: field.onChange,
              onBlur: field.onBlur,
              ref: field.ref
            })
            return (
              <input
                {...downshiftSrcProps}
                name={field.name}
                placeholder={placeholder}
                className={styles.downshiftInput}
                autoFocus
                size={30}
                data-editor-dialog={true}
              />
            )
          }}
        />
        {enableAutoComplete && (
          <button aria-label="toggle menu" type="button" {...getToggleButtonProps()}>
            <DropDownIcon />
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
  )
}
