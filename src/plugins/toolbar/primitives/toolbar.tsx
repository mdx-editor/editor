import * as RadixSelect from '@radix-ui/react-select'
import * as RadixToolbar from '@radix-ui/react-toolbar'
import classNames from 'classnames'
import React from 'react'
import styles from '../../../styles/ui.module.css'
import { TooltipWrap } from './TooltipWrap'
import { SelectButtonTrigger, SelectContent, SelectItem } from './select'
import { EditorInFocus, corePluginHooks } from '../../core'

//
// function decorate<P extends { className?: string | undefined }>(Component: React.ComponentType<P>, decoratedProps: P) {
//   return (props: P) => {
//     const className = classNames(decoratedProps.className, props.className)
//     return <Component {...decoratedProps} {...props} className={className} />
//   }
// }
//

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

/**
 * @internal
 */
export const Root: React.FC<{ readOnly: boolean; children: React.ReactNode }> = ({ readOnly, children }) => {
  return (
    <RadixToolbar.Root
      className={classNames(styles.toolbarRoot, { [styles.readOnlyToolbarRoot]: readOnly })}
      {...(readOnly ? { tabIndex: -1 } : {})}
    >
      {children}
    </RadixToolbar.Root>
  )
}

/**
 * A toolbar button primitive.
 */
export const Button = decorateWithRef(RadixToolbar.Button, { className: styles.toolbarButton, 'data-toolbar-item': true })

/**
 * A toolbar button with a custom toolbar primitive.
 */
export const ButtonWithTooltip = addTooltipToChildren(Button)

/**
 * @internal
 */
export const ToolbarToggleItem = decorateWithRef(RadixToolbar.ToggleItem, {
  className: styles.toolbarToggleItem,
  'data-toolbar-item': true
})

/**
 * @internal
 */
export const SingleToggleGroup = decorateWithRef(RadixToolbar.ToggleGroup, {
  type: 'single',
  className: styles.toolbarToggleSingleGroup
})

/**
 * @internal
 */
export const ToggleSingleGroupWithItem = React.forwardRef<
  HTMLDivElement,
  Omit<RadixToolbar.ToolbarToggleGroupSingleProps, 'type'> & { on: boolean; title: string; disabled?: boolean }
>(({ on, title, children, disabled, ...props }, forwardedRef) => {
  return (
    <RadixToolbar.ToggleGroup
      type="single"
      className={styles.toolbarToggleSingleGroup}
      {...props}
      value={on ? 'on' : 'off'}
      ref={forwardedRef}
    >
      <ToolbarToggleItem title={title} value="on" disabled={disabled}>
        <TooltipWrap title={title}>{children}</TooltipWrap>
      </ToolbarToggleItem>
    </RadixToolbar.ToggleGroup>
  )
})

/**
 * A toolbar primitive that allows you to build an UI with multiple non-exclusive toggle groups, like the bold/italic/underline toggle.
 */
export const MultipleChoiceToggleGroup: React.FC<{
  items: {
    title: string
    contents: React.ReactNode
    active: boolean
    onChange: (active: boolean) => void
    disabled?: boolean
  }[]
}> = ({ items }) => {
  return (
    <div className={styles.toolbarGroupOfGroups}>
      {items.map((item, index) => (
        <ToggleSingleGroupWithItem
          key={index}
          title={item.title}
          on={item.active}
          onValueChange={(v) => item.onChange(v === 'on')}
          disabled={item.disabled}
        >
          {item.contents}
        </ToggleSingleGroupWithItem>
      ))}
    </div>
  )
}

/**
 * The properties of the {@link SingleChoiceToggleGroup} React component.
 */
export interface SingleChoiceToggleGroupProps<T extends string> {
  items: {
    title: string
    value: T
    contents: React.ReactNode
  }[]
  onChange: (value: T) => void
  value: T
  className?: string
}

/**
 * A toolbar primitive that allows you to build an UI with multiple exclusive toggle groups, like the list type toggle.
 */
export const SingleChoiceToggleGroup = <T extends string>({ value, onChange, className, items }: SingleChoiceToggleGroupProps<T>) => {
  return (
    <div className={styles.toolbarGroupOfGroups}>
      <RadixToolbar.ToggleGroup
        type="single"
        className={classNames(styles.toolbarToggleSingleGroup, className)}
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

/**
 * The properties of the {@link ButtonOrDropdownButton} React component.
 */
export interface ButtonOrDropdownButtonProps<T extends string> {
  /**
   * The contents of the button - usually an icon.
   */
  children: React.ReactNode
  /**
   * The title used for the tooltip.
   */
  title: string
  /**
   * The function to execute when the button is clicked or an item is chosen from the dropdown.
   * If there is only one item in the dropdown, the value will be an empty string.
   */
  onChoose: (value: T) => void
  /**
   * The items to show in the dropdown.
   */
  items: {
    /**
     * The value to pass to the `onChoose` function when this item is chosen.
     */
    value: T
    /**
     * The label to show in the dropdown.
     */
    label: string
  }[]
}

/**
 * Use this primitive to create a toolbar button that can be either a button or a dropdown, depending on the number of items passed.
 *
 * @see {@link ButtonOrDropdownButtonProps} for the properties of the React component.
 */
export const ButtonOrDropdownButton = <T extends string>(props: ButtonOrDropdownButtonProps<T>) => {
  const [readOnly] = corePluginHooks.useEmitterValues('readOnly')
  return (
    <>
      {props.items.length === 1 ? (
        <ButtonWithTooltip title={props.title} onClick={() => props.onChoose('' as T)} disabled={readOnly}>
          {props.children}
        </ButtonWithTooltip>
      ) : (
        <RadixSelect.Root value="" onValueChange={props.onChoose}>
          <SelectButtonTrigger title={props.title}>{props.children}</SelectButtonTrigger>

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

/**
 * An object that describes a possible option to be displayed in the {@link ConditionalContents} component.
 */
export type ConditionalContentsOption = {
  /**
   * A function that returns `true` if the option should be displayed for the current editor in focus.
   */
  when: (rootNode: EditorInFocus | null) => boolean
  /**
   * The contents to display if the `when` function returns `true`.
   */
  contents: () => React.ReactNode
}

/**
 * A default option to be displayed in the {@link ConditionalContents} component if none of the other options match.
 */
export type FallBackOption = {
  /**
   * The contents to display
   */
  fallback: () => React.ReactNode
}

function isConditionalContentsOption(option: ConditionalContentsOption | FallBackOption): option is ConditionalContentsOption {
  return Object.hasOwn(option, 'when')
}

/**
 * The properties of the {@link ConditionalContents} React component.
 */
export interface ConditionalContentsProps {
  /**
   * A set of options that define the contents to show based on the editor that is in focus.
   * Can be either a {@link ConditionalContentsOption} or a {@link FallBackOption}.
   * See the {@link ConditionalContents} documentation for an example.
   */
  options: (ConditionalContentsOption | FallBackOption)[]
}

/**
 * A toolbar primitive that allows you to show different contents based on the editor that is in focus.
 * Useful for code editors that have different features and don't support rich text formatting.
 * @example
 * ```tsx
 *    <ConditionalContents
 *      options={[
 *        { when: (editor) => editor?.editorType === 'codeblock', contents: () => <ChangeCodeMirrorLanguage /> },
 *        { when: (editor) => editor?.editorType === 'sandpack', contents: () => <ShowSandpackInfo /> },
 *        {
 *          fallback: () => (
 *            <>
 *              <UndoRedo />
 *              <BoldItalicUnderlineToggles />
 *              <InsertCodeBlock />
 *            </>
 *          )
 *        }
 *      ]}
 *    />
 * ```
 */
export const ConditionalContents: React.FC<ConditionalContentsProps> = ({ options }) => {
  const [editorInFocus] = corePluginHooks.useEmitterValues('editorInFocus')
  const contents = React.useMemo(() => {
    const option = options.find((option) => {
      if (isConditionalContentsOption(option)) {
        if (option.when(editorInFocus)) {
          return true
        }
      } else {
        return true
      }
    })
    return option ? (isConditionalContentsOption(option) ? option.contents() : option.fallback()) : null
  }, [options, editorInFocus])

  return <div style={{ display: 'flex' }}>{contents}</div>
}

/**
 * A toolbar primitive that allows you to show a separator between toolbar items.
 * By default, the separator is styled as vertical line.
 */
export const Separator = RadixToolbar.Separator
