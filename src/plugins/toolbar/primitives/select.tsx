import React from 'react'
import * as RadixSelect from '@radix-ui/react-select'
import classNames from 'classnames'
import styles from '../../../styles/ui.module.css'
import { TooltipWrap } from './TooltipWrap'
import { editorRootElementRef$, iconComponentFor$, readOnly$ } from '../../core'
import { useCellValue, useCellValues } from '@mdxeditor/gurx'

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
  const [readOnly, iconComponentFor] = useCellValues(readOnly$, iconComponentFor$)
  return (
    <TooltipWrap title={title}>
      <RadixSelect.Trigger
        aria-label={placeholder}
        className={classNames(styles.selectTrigger, className)}
        data-toolbar-item={true}
        disabled={readOnly}
      >
        <RadixSelect.Value placeholder={placeholder} />
        <RadixSelect.Icon className={styles.selectDropdownArrow}>{iconComponentFor('arrow_drop_down')}</RadixSelect.Icon>
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
  const editorRootElementRef = useCellValue(editorRootElementRef$)

  return (
    <RadixSelect.Portal container={editorRootElementRef?.current}>
      <RadixSelect.Content
        className={classNames(className, 'mdxeditor-select-content')}
        onCloseAutoFocus={(e) => {
          e.preventDefault()
        }}
        position="popper"
      >
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
  const [readOnly, iconComponentFor] = useCellValues(readOnly$, iconComponentFor$)
  return (
    <TooltipWrap title={title}>
      <RadixSelect.Trigger className={classNames(styles.toolbarButtonSelectTrigger, className)} disabled={readOnly}>
        {children}
        <RadixSelect.Icon className={styles.selectDropdownArrow}>{iconComponentFor('arrow_drop_down')}</RadixSelect.Icon>
      </RadixSelect.Trigger>
    </TooltipWrap>
  )
}

/**
 * A toolbar primitive you can use to build dropdowns, such as the block type select.
 * @group Toolbar Primitives
 */
export const Select = <T extends string>(props: {
  value: T
  onChange: (value: T) => void
  triggerTitle: string
  placeholder: string
  items: ({ label: string | JSX.Element; value: T } | 'separator')[]
}) => {
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
