import React from 'react'
import * as RadixSelect from '@radix-ui/react-select'
import DropDownIcon from '../../../icons/arrow_drop_down.svg'
import classNames from 'classnames'
import styles from '../../../styles/ui.module.css'
import { TooltipWrap } from './TooltipWrap'
import { corePluginHooks } from '../../core/realmPlugin'

export const SelectItem = React.forwardRef<HTMLDivElement | null, { className?: string; children: React.ReactNode; value: string }>(
  ({ children, className, ...props }, forwardedRef) => {
    return (
      <RadixSelect.Item {...props} ref={forwardedRef} className={classNames(className, styles.selectItem)}>
        <RadixSelect.ItemText>{children}</RadixSelect.ItemText>
      </RadixSelect.Item>
    )
  }
)

export const SelectTrigger: React.FC<{ title: string; placeholder: string; className?: string }> = ({ title, placeholder, className }) => {
  return (
    <TooltipWrap title={title}>
      <RadixSelect.Trigger aria-label={placeholder} className={classNames(styles.selectTrigger, className)}>
        <RadixSelect.Value placeholder={placeholder} />
        <RadixSelect.Icon className={styles.selectDropdownArrow}>
          <DropDownIcon />
        </RadixSelect.Icon>
      </RadixSelect.Trigger>
    </TooltipWrap>
  )
}

export const SelectContent: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = styles.selectContainer
}) => {
  const [editorRootElementRef] = corePluginHooks.useEmitterValues('editorRootElementRef')

  return (
    <RadixSelect.Portal container={editorRootElementRef?.current}>
      <RadixSelect.Content className={className} onCloseAutoFocus={(e) => e.preventDefault()} position="popper">
        <RadixSelect.Viewport>{children}</RadixSelect.Viewport>
      </RadixSelect.Content>
    </RadixSelect.Portal>
  )
}

export const SelectButtonTrigger: React.FC<{ children: React.ReactNode; title: string; className?: string }> = ({
  children,
  title,
  className
}) => {
  return (
    <TooltipWrap title={title}>
      <RadixSelect.Trigger className={classNames(styles.toolbarButtonSelectTrigger, className)}>
        {children}
        <RadixSelect.Icon className={styles.selectDropdownArrow}>
          <DropDownIcon />
        </RadixSelect.Icon>
      </RadixSelect.Trigger>
    </TooltipWrap>
  )
}

export interface SelectProps<T extends string> {
  value: T
  onChange: (value: T) => void
  triggerTitle: string
  placeholder: string
  items: ({ label: string; value: T } | 'separator')[]
}

export const Select = <T extends string>(props: SelectProps<T>) => {
  return (
    <RadixSelect.Root value={props.value} onValueChange={props.onChange}>
      <SelectTrigger title={props.triggerTitle} placeholder={props.placeholder} />
      <SelectContent>
        {props.items.map((item, index) => {
          if (item === 'separator') {
            return <RadixSelect.Separator key={index} />
          }
          return (
            <SelectItem key={index} value={item.value}>
              {item.label}
            </SelectItem>
          )
        })}
      </SelectContent>
    </RadixSelect.Root>
  )
}
