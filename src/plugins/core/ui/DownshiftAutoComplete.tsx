import { useCombobox } from 'downshift'
import React from 'react'
import { Control, UseFormSetValue, Controller } from 'react-hook-form'
import styles from '../../../styles/ui.module.css'
import DropDownIcon from '../../../icons/arrow_drop_down.svg'

const MAX_SUGGESTIONS = 20

export const DownshiftAutoComplete: React.FC<{
  suggestions: string[]
  control: Control<any, any>
  setValue: UseFormSetValue<any>
  placeholder: string
  inputName: string
  autofocus?: boolean
  initialInputValue: string
}> = ({ autofocus, suggestions, control, inputName, placeholder, initialInputValue, setValue }) => {
  const [items, setItems] = React.useState(suggestions.slice(0, MAX_SUGGESTIONS))

  const enableAutoComplete = suggestions.length > 0

  const { isOpen, getToggleButtonProps, getMenuProps, getInputProps, highlightedIndex, getItemProps, selectedItem } = useCombobox({
    initialInputValue,
    onInputValueChange({ inputValue = '' }) {
      setValue(inputName, inputValue)
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
            const downshiftSrcProps = getInputProps()
            return (
              <input
                {...downshiftSrcProps}
                name={field.name}
                placeholder={placeholder}
                className={styles.downshiftInput}
                size={30}
                data-editor-dialog={true}
                autoFocus={autofocus}
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
