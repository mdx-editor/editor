import React from 'react'
import * as Select from '@radix-ui/react-select'
import DropDownIcon from './icons/arrow_drop_down.svg'
import classNames from 'classnames'
import styles from '../styles.module.css'
import { useEmitterValues } from '../../system'

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
  const [editorRootElementRef] = useEmitterValues('editorRootElementRef')

  return (
    <Select.Portal container={editorRootElementRef?.current}>
      <Select.Content className={styles.toolbarNodeKindSelectContainer} onCloseAutoFocus={(e) => e.preventDefault()} position="popper">
        <Select.Viewport>{children}</Select.Viewport>
      </Select.Content>
    </Select.Portal>
  )
}
