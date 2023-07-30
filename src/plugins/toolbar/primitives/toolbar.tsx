import * as RadixSelect from '@radix-ui/react-select'
import * as RadixToolbar from '@radix-ui/react-toolbar'
import classNames from 'classnames'
import React from 'react'
import styles from '../../../styles/ui.module.css'
import { TooltipWrap } from './TooltipWrap'
import { SelectButtonTrigger, SelectContent, SelectItem } from './select'

function decorate<P extends { className?: string | undefined }>(Component: React.ComponentType<P>, decoratedProps: P) {
  return (props: P) => {
    const className = classNames(decoratedProps.className, props.className)
    return <Component {...decoratedProps} {...props} className={className} />
  }
}

function decorateWithRef<P extends { className?: string | undefined }>(
  Component: React.ForwardRefExoticComponent<P>,
  decoratedProps: Partial<React.PropsWithoutRef<P>> & { 'data-toolbar-item'?: boolean }
) {
  return React.forwardRef<object, P>((props: P, ref) => {
    const className = classNames(decoratedProps.className, props.className)
    return <Component {...decoratedProps} {...props} className={className} ref={ref} />
  })
}

function addTooltipToChildren<C extends React.ComponentType<{ children: React.ReactNode }>>(Component: C) {
  return ({ title, children, ...props }: React.ComponentProps<C> & { title: string }) => {
    return (
      <Component {...(props as any)}>
        <TooltipWrap title={title}>{children}</TooltipWrap>
      </Component>
    )
  }
}

export const Root = decorate(RadixToolbar.Root, { className: styles.toolbarRoot })

export const Button = decorateWithRef(RadixToolbar.Button, { className: styles.toolbarButton, 'data-toolbar-item': true })

export const ButtonWithTooltip = addTooltipToChildren(Button)

export const ToolbarToggleItem = decorateWithRef(RadixToolbar.ToggleItem, {
  className: styles.toolbarToggleItem,
  'data-toolbar-item': true
})

export const SingleToggleGroup = decorateWithRef(RadixToolbar.ToggleGroup, {
  type: 'single',
  className: styles.toolbarToggleSingleGroup
})

export const ToggleSingleGroupWithItem = React.forwardRef<
  HTMLDivElement,
  Omit<RadixToolbar.ToolbarToggleGroupSingleProps, 'type'> & { on: boolean; title: string }
>(({ on, title, children, ...props }, forwardedRef) => {
  return (
    <RadixToolbar.ToggleGroup
      type="single"
      className={styles.toolbarToggleSingleGroup}
      {...props}
      value={on ? 'on' : 'off'}
      ref={forwardedRef}
    >
      <ToolbarToggleItem title={title} value="on">
        <TooltipWrap title={title}>{children}</TooltipWrap>
      </ToolbarToggleItem>
    </RadixToolbar.ToggleGroup>
  )
})

export const MultipleChoiceToggleGroup: React.FC<{
  items: {
    title: string
    contents: React.ReactNode
    active: boolean
    onChange: (active: boolean) => void
  }[]
}> = ({ items }) => {
  return (
    <div className={styles.toolbarGroupOfGroups}>
      {items.map((item, index) => (
        <ToggleSingleGroupWithItem key={index} title={item.title} on={item.active} onValueChange={(v) => item.onChange(v === 'on')}>
          {item.contents}
        </ToggleSingleGroupWithItem>
      ))}
    </div>
  )
}

interface SingleChoiceToggleGroupProps<T extends string> {
  items: {
    title: string
    value: T
    contents: React.ReactNode
  }[]
  onChange: (value: T) => void
  value: T
}

export const SingleChoiceToggleGroup = <T extends string>({ value, onChange, items }: SingleChoiceToggleGroupProps<T>) => {
  return (
    <div className={styles.toolbarGroupOfGroups}>
      <RadixToolbar.ToggleGroup
        type="single"
        className={styles.toolbarToggleSingleGroup}
        onValueChange={onChange}
        value={value || ''}
        onFocus={(e) => e.preventDefault()}
      >
        {items.map((item, index) => (
          <ToolbarToggleItem key={index} value={item.value}>
            <TooltipWrap title={item.title}>{item.contents}</TooltipWrap>
          </ToolbarToggleItem>
        ))}
      </RadixToolbar.ToggleGroup>
    </div>
  )
}
export interface ButtonOrDropdownButtonProps<T extends string> {
  children: React.ReactNode
  title: string
  onChoose: (T: string) => void
  items: { value: T; label: string }[]
}

export const ButtonOrDropdownButton = <T extends string>(props: ButtonOrDropdownButtonProps<T>) => {
  return (
    <>
      {props.items.length === 1 ? (
        <ButtonWithTooltip title={props.title} onClick={() => props.onChoose('')}>
          {props.children}
        </ButtonWithTooltip>
      ) : (
        <RadixSelect.Root value="" onValueChange={props.onChoose}>
          <SelectButtonTrigger title="Insert live code snippet">{props.children}</SelectButtonTrigger>

          <SelectContent className={styles.toolbarButtonDropdownContainer}>
            {props.items.map((item, index) => (
              <SelectItem key={index} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </RadixSelect.Root>
      )}
    </>
  )
}

export const Separator = RadixToolbar.Separator
