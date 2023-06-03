import React from 'react'
import * as Select from '@radix-ui/react-select'
import { ReactComponent as DropDownIcon } from './icons/arrow_drop_down.svg'
import classNames from 'classnames'
import styles from '../styles.module.css'

export const SelectItem = React.forwardRef<HTMLDivElement | null, { className?: string; children: React.ReactNode; value: string }>(
  ({ children, className, ...props }, forwardedRef) => {
    return (
      <Select.Item {...props} ref={forwardedRef} className={classNames(className, styles.toolbarNodeKindSelectItem)}>
        <Select.ItemText>{children}</Select.ItemText>
      </Select.Item>
    )
  }
)
export function SelectTrigger({ placeholder }: { placeholder: string }) {
  return (
    <Select.Trigger aria-label={placeholder} className={styles.toolbarNodeKindSelectTrigger}>
      <Select.Value placeholder={placeholder} />
      <Select.Icon className={styles.toolbarNodeKindSelectDropdownArrow}>
        <DropDownIcon />
      </Select.Icon>
    </Select.Trigger>
  )
}

export function SelectContent({ children }: { children: React.ReactNode }) {
  return (
    <Select.Portal className={classNames('font-sans z-[60]', styles.editorRoot)}>
      <Select.Content className={styles.toolbarNodeKindSelectContainer} onCloseAutoFocus={(e) => e.preventDefault()} position="popper">
        <Select.Viewport className="">{children}</Select.Viewport>
      </Select.Content>
    </Select.Portal>
  )
}
