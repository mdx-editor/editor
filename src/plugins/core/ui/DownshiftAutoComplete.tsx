import { useCombobox } from 'downshift'
import React from 'react'
import { Control, UseFormSetValue, Controller, UseFormRegister } from 'react-hook-form'
import styles from '../../../styles/ui.module.css'
import DropDownIcon from '../../../icons/arrow_drop_down.svg'

const MAX_SUGGESTIONS = 20

interface DownshiftAutoCompleteProps {
  suggestions: string[]
  control: Control<any, any>
  setValue: UseFormSetValue<any>
  register: UseFormRegister<any>
  placeholder: string
  inputName: string
  autofocus?: boolean
  initialInputValue: string
}

interface useComboxProps { isOpen, getToggleButtonProps, getMenuProps, getInputProps, highlightedIndex, getItemProps, selectedItem }

export const DownshiftAutoComplete: React.FC<DownshiftAutoCompleteProps> = (props) => {
  if (props.suggestions.length > 0) {
    return <DownshiftAutoCompleteWithSuggestions {...props} />
  } else {
    return <input className={styles.textInput} size={40} autoFocus {...props.register(props.inputName)} />
  }
}

export const DownshiftAutoCompleteWithSuggestions: React.FC<DownshiftAutoCompleteProps> = (props) => {
  const [items, setItems] = React.useState(props.suggestions.slice(0, MAX_SUGGESTIONS))

  const enableAutoComplete = props.suggestions.length > 0

  const useComboxVariables = useCombobox({
    initialInputValue: props.initialInputValue,
    onInputValueChange({ inputValue = '' }) {
      props.setValue(props.inputName, inputValue)
      inputValue = inputValue?.toLowerCase() || ''
      const matchingItems = []
      for (const suggestion of props.suggestions) {
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

  const dropdownIsVisible = useComboxVariables.isOpen && items.length > 0
  return (
    <div className={styles.downshiftAutocompleteContainer}>
      <div data-visible-dropdown={dropdownIsVisible} className={styles.downshiftInputWrapper}>
        <Controller
          name={props.inputName}
          control={props.control}
          render={({ field }) => {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const downshiftSrcProps = useComboxVariables.getInputProps()
            return (
              <input
                {...downshiftSrcProps}
                name={field.name}
                placeholder={props.placeholder}
                className={styles.downshiftInput}
                size={30}
                data-editor-dialog={true}
                autoFocus={props.autofocus}
              />
            )
          }}
        />
        {enableAutoComplete && (
          <button aria-label="toggle menu" type="button" {...useComboxVariables.getToggleButtonProps()}>
            <DropDownIcon />
          </button>
        )}
      </div>

      <div className={styles.downshiftAutocompleteContainer}>
        <ul {...useComboxVariables.getMenuProps()} data-visible={dropdownIsVisible}>
          {items.map((item, index: number) => (
            <li
              data-selected={useComboxVariables.selectedItem === item}
              data-highlighted={useComboxVariables.highlightedIndex === index}
              key={`${item}${index}`}
              {...useComboxVariables.getItemProps({ item, index })}
            >
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
