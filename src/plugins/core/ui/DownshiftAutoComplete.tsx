import { useCombobox } from 'downshift'
import React from 'react'
import { Control, UseFormSetValue, Controller, UseFormRegister } from 'react-hook-form'
import styles from '../../../styles/ui.module.css'
import { iconComponentFor$ } from '..'
import { useCellValue } from '@mdxeditor/gurx'

const MAX_SUGGESTIONS = 20

interface DownshiftAutoCompleteProps {
  suggestions: string[]
  control: Control<any>
  setValue: UseFormSetValue<any>
  register: UseFormRegister<any>
  placeholder: string
  inputName: string
  autofocus?: boolean
  initialInputValue: string
}

export const DownshiftAutoComplete: React.FC<DownshiftAutoCompleteProps> = (props) => {
  if (props.suggestions.length > 0) {
    return <DownshiftAutoCompleteWithSuggestions {...props} />
  } else {
    return <input className={styles.textInput} size={40} autoFocus {...props.register(props.inputName)} />
  }
}

export const DownshiftAutoCompleteWithSuggestions: React.FC<DownshiftAutoCompleteProps> = ({
  autofocus,
  suggestions,
  control,
  inputName,
  placeholder,
  initialInputValue,
  setValue
}) => {
  const [items, setItems] = React.useState(suggestions.slice(0, MAX_SUGGESTIONS))
  const iconComponentFor = useCellValue(iconComponentFor$)

  const enableAutoComplete = suggestions.length > 0

  const { isOpen, getToggleButtonProps, getMenuProps, getInputProps, highlightedIndex, getItemProps, selectedItem } = useCombobox({
    initialInputValue,
    onInputValueChange({ inputValue = '' }) {
      setValue(inputName, inputValue)
      inputValue = inputValue.toLowerCase() || ''
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
  )
}
