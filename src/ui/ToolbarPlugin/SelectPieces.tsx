import React from 'react'
import * as Select from '@radix-ui/react-select'
import DropDownIcon from '../icons/arrow_drop_down.svg'
import classNames from 'classnames'
import styles from '../styles.module.css'
import { useEmitterValues } from '../../system/EditorSystemComponent'

export const SelectItem = React.forwardRef<HTMLDivElement | null, { className?: string; children: React.ReactNode; value: string }>(
  ({ children, className, ...props }, forwardedRef) => {
    return (
      <Select.Item {...props} ref={forwardedRef} className={classNames(className, styles.toolbarNodeKindSelectItem)}>
        <Select.ItemText>{children}</Select.ItemText>
      </Select.Item>
    )
  }
)

export const SelectTrigger: React.FC<{ placeholder: string }> = ({ placeholder }) => {
  return (
    <Select.Trigger aria-label={placeholder} className={styles.toolbarNodeKindSelectTrigger}>
      <Select.Value placeholder={placeholder} />
      <Select.Icon className={styles.toolbarNodeKindSelectDropdownArrow}>
        <DropDownIcon />
      </Select.Icon>
    </Select.Trigger>
  )
}

export const SelectContent: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = styles.toolbarNodeKindSelectContainer,
}) => {
  const [editorRootElementRef] = useEmitterValues('editorRootElementRef')

  return (
    <Select.Portal container={editorRootElementRef?.current}>
      <Select.Content className={className} onCloseAutoFocus={(e) => e.preventDefault()} position="popper">
        <Select.Viewport>{children}</Select.Viewport>
      </Select.Content>
    </Select.Portal>
  )
}

export const SelectButtonTrigger: React.FC<{ children: React.ReactNode; title: string; className?: string }> = ({
  children,
  title,
  className,
}) => {
  return (
    <Select.Trigger className={classNames(styles.toolbarButtonSelectTrigger, className)} title={title}>
      {children}
      <Select.Icon className={styles.toolbarNodeKindSelectDropdownArrow}>
        <DropDownIcon />
      </Select.Icon>
    </Select.Trigger>
  )
}
