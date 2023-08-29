import React from 'react'
import * as RadixSelect from '@radix-ui/react-select'
import DropDownIcon from '../../../icons/arrow_drop_down.svg'
import classNames from 'classnames'
import styles from '../../../styles/ui.module.css'
import { TooltipWrap } from './TooltipWrap'
import { corePluginHooks } from '../../core'

/**
 * @internal
 */
export const SelectItem = React.forwardRef<HTMLDivElement | null, { className?: string; children: React.ReactNode; value: string }>(
  ({ children, className, ...props }, forwardedRef) => {
    return (
      <RadixSelect.Item {...props} ref={forwardedRef} className={classNames(className, styles.selectItem)}>
        <RadixSelect.ItemText>{children}</RadixSelect.ItemText>
      </RadixSelect.Item>
    )
  }
)

/**
 * @internal
 */
export const SelectTrigger: React.FC<{ title: string; placeholder: string; className?: string }> = ({ title, placeholder, className }) => {
  const [readOnly] = corePluginHooks.useEmitterValues('readOnly')
  return (
    <TooltipWrap title={title}>
      <RadixSelect.Trigger
        aria-label={placeholder}
        className={classNames(styles.selectTrigger, className)}
        data-toolbar-item={true}
        disabled={readOnly}
      >
        <RadixSelect.Value placeholder={placeholder} />
        <RadixSelect.Icon className={styles.selectDropdownArrow}>
          <DropDownIcon />
        </RadixSelect.Icon>
      </RadixSelect.Trigger>
    </TooltipWrap>
  )
}

/**
 * @internal
 */
export const SelectContent: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = styles.selectContainer
}) => {
  const [editorRootElementRef] = corePluginHooks.useEmitterValues('editorRootElementRef')

  return (
    <RadixSelect.Portal container={editorRootElementRef?.current}>
      <RadixSelect.Content className={className} onCloseAutoFocus={(e) => e.preventDefault()} position="popper">
        <RadixSelect.Viewport data-editor-dropdown={true}>{children}</RadixSelect.Viewport>
      </RadixSelect.Content>
    </RadixSelect.Portal>
  )
}

/**
 * @internal
 */
export const SelectButtonTrigger: React.FC<{ children: React.ReactNode; title: string; className?: string }> = ({
  children,
  title,
  className
}) => {
  const [readOnly] = corePluginHooks.useEmitterValues('readOnly')
  return (
    <TooltipWrap title={title}>
      <RadixSelect.Trigger className={classNames(styles.toolbarButtonSelectTrigger, className)} disabled={readOnly}>
        {children}
        <RadixSelect.Icon className={styles.selectDropdownArrow}>
          <DropDownIcon />
        </RadixSelect.Icon>
      </RadixSelect.Trigger>
    </TooltipWrap>
  )
}

/**
 * The properties of the {@link Select} React component.
 */
export interface SelectProps<T extends string> {
  value: T
  onChange: (value: T) => void
  triggerTitle: string
  placeholder: string
  items: ({ label: string; value: T } | 'separator')[]
}

/**
 * A toolbar primitive you can use to build dropdowns, such as the block type select.
 * See {@link SelectProps} for more details.
 */
export const Select = <T extends string>(props: SelectProps<T>) => {
  return (
    <RadixSelect.Root value={props.value || undefined} onValueChange={props.onChange}>
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
