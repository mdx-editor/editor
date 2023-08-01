import * as Select from '@radix-ui/react-select'
import * as RadixToolbar from '@radix-ui/react-toolbar'
import classNames from 'classnames'
import React from 'react'
import { IS_BOLD, IS_CODE, IS_ITALIC, IS_UNDERLINE } from '../../FormatConstants'
import { useEmitterValues, usePublisher } from '../../system/EditorSystemComponent'
import type { ViewMode } from '../../types/ViewMode'
import styles from '../styles.module.css'
import CodeIcon from './../icons/code.svg'
import LiveCodeIcon from './../icons/deployed_code.svg'
import DifferenceIcon from './../icons/difference.svg'
import BoldIcon from './../icons/format_bold.svg'
import ItalicIcon from './../icons/format_italic.svg'
import BulletedListIcon from './../icons/format_list_bulleted.svg'
import NumberedListIcon from './../icons/format_list_numbered.svg'
import UnderlinedIcon from './../icons/format_underlined.svg'
import FrameSourceIcon from './../icons/frame_source.svg'
import FrontmatterIcon from './../icons/frontmatter.svg'
import HorizontalRuleIcon from './../icons/horizontal_rule.svg'
import LinkIcon from './../icons/link.svg'
import MarkdownIcon from './../icons/markdown.svg'
import RichTextIcon from './../icons/rich_text.svg'
import TableIcon from './../icons/table.svg'
import { BlockTypeSelect } from './BlockTypeSelect'
import { ImageButton } from './Image'
import { InstantTooltip } from './InstantTooltip'
import { SelectButtonTrigger, SelectContent, SelectItem } from './SelectPieces'
import { DialogButton } from './DialogButton'
import { SandpackConfig } from '../../plugins/sandpack'

export { BlockTypeSelect } from './BlockTypeSelect'
export { ImageButton } from './Image'
export { InstantTooltip } from './InstantTooltip'

export const ToggleItem = React.forwardRef<HTMLButtonElement, RadixToolbar.ToolbarToggleItemProps & { title: string }>(
  ({ title, children, className: passedClassName, ...props }, forwardedRef) => {
    return (
      <RadixToolbar.ToggleItem
        data-toolbar-item={true}
        className={classNames(passedClassName, styles.toolbarToggleItem)}
        {...props}
        ref={forwardedRef}
      >
        <InstantTooltip title={title}>{children}</InstantTooltip>
      </RadixToolbar.ToggleItem>
    )
  }
)

export const ToolbarButton = React.forwardRef<HTMLButtonElement, RadixToolbar.ToolbarButtonProps & { title: string }>(
  ({ title, children, ...props }, forwardedRef) => {
    return (
      <RadixToolbar.Button data-toolbar-item={true} className={styles.toolbarButton} {...props} ref={forwardedRef}>
        <InstantTooltip title={title}>{children}</InstantTooltip>
      </RadixToolbar.Button>
    )
  }
)

export const ToggleSingleGroup = React.forwardRef<HTMLDivElement, Omit<RadixToolbar.ToolbarToggleGroupSingleProps, 'type'>>(
  ({ children, className, ...props }, forwardedRef) => {
    return (
      <RadixToolbar.ToggleGroup
        {...props}
        type="single"
        ref={forwardedRef}
        className={classNames(styles.toolbarToggleSingleGroup, className)}
      >
        {children}
      </RadixToolbar.ToggleGroup>
    )
  }
)

export const ToggleSingleGroupWithItem = React.forwardRef<
  HTMLDivElement,
  Omit<RadixToolbar.ToolbarToggleGroupSingleProps, 'type'> & { on: boolean; title: string }
>(({ on, title, children, ...props }, forwardedRef) => {
  return (
    <ToggleSingleGroup {...props} value={on ? 'on' : 'off'} ref={forwardedRef}>
      <ToggleItem title={title} value="on">
        {children}
      </ToggleItem>
    </ToggleSingleGroup>
  )
})

export const GroupGroup: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <div className={styles.toolbarGroupOfGroups}>{children}</div>
}

export const ToolbarSeparator = RadixToolbar.ToolbarSeparator

export const BoldItalicUnderlineButtons: React.FC = () => {
  const [currentFormat] = useEmitterValues('currentFormat', 'currentListType')
  const applyFormat = usePublisher('applyFormat')

  const boldIsOn = (currentFormat & IS_BOLD) !== 0
  const italicIsOn = (currentFormat & IS_ITALIC) !== 0
  const underlineIsOn = (currentFormat & IS_UNDERLINE) !== 0

  const boldTitle = boldIsOn ? 'Remove bold' : 'Bold'
  const italicTitle = italicIsOn ? 'Remove italic' : 'Italic'
  const underlineTitle = underlineIsOn ? 'Remove underline' : 'Underline'
  return (
    <GroupGroup>
      <ToggleSingleGroupWithItem title={boldTitle} aria-label="Bold" on={boldIsOn} onValueChange={applyFormat.bind(null, 'bold')}>
        <BoldIcon />
      </ToggleSingleGroupWithItem>
      <ToggleSingleGroupWithItem title={italicTitle} aria-label="Italic" on={italicIsOn} onValueChange={applyFormat.bind(null, 'italic')}>
        <ItalicIcon />
      </ToggleSingleGroupWithItem>
      <ToggleSingleGroupWithItem
        aria-label="Underline"
        title={underlineTitle}
        on={underlineIsOn}
        onValueChange={applyFormat.bind(null, 'underline')}
      >
        <UnderlinedIcon style={{ transform: 'translateY(2px)' }} />
      </ToggleSingleGroupWithItem>
    </GroupGroup>
  )
}

export const CodeFormattingButton: React.FC = () => {
  const [currentFormat] = useEmitterValues('currentFormat', 'currentListType')
  const applyFormat = usePublisher('applyFormat')
  const codeIsOn = (currentFormat & IS_CODE) !== 0
  const codeTitle = codeIsOn ? 'Remove inline code' : 'Inline code'
  return (
    <GroupGroup>
      <ToggleSingleGroupWithItem title={codeTitle} aria-label="Inline code" on={codeIsOn} onValueChange={applyFormat.bind(null, 'code')}>
        <CodeIcon />
      </ToggleSingleGroupWithItem>
    </GroupGroup>
  )
}

export const ListButtons: React.FC = () => {
  const [currentListType] = useEmitterValues('currentListType')
  const applyListType = usePublisher('applyListType')
  return (
    <GroupGroup>
      <ToggleSingleGroup
        aria-label="List type"
        onValueChange={applyListType}
        value={currentListType || ''}
        onFocus={(e) => e.preventDefault()}
      >
        <ToggleItem title="Bulleted list" value="bullet" aria-label="Bulleted list">
          <BulletedListIcon />
        </ToggleItem>
        <ToggleItem title="Numbered list" value="number" aria-label="Numbered list">
          <NumberedListIcon />
        </ToggleItem>
      </ToggleSingleGroup>
    </GroupGroup>
  )
}

export const LinkButton: React.FC = () => {
  const openLinkEditDialog = usePublisher('openLinkEditDialog')
  return (
    <ToolbarButton title="Create link" onClick={openLinkEditDialog.bind(null, true)}>
      <LinkIcon />
    </ToolbarButton>
  )
}

export const TableButton: React.FC = () => {
  const insertTable = usePublisher('insertTable')
  return (
    <ToolbarButton title="Insert table" onClick={insertTable.bind(null, true)}>
      <TableIcon />
    </ToolbarButton>
  )
}

export const CodeBlockButton: React.FC = () => {
  //TODO
  const insertCodeBlock = () => {
    throw new Error('')
  }

  return (
    <ToolbarButton title="Insert code block" onClick={insertCodeBlock.bind(null, true)}>
      <FrameSourceIcon />
    </ToolbarButton>
  )
}

export const HorizontalRuleButton: React.FC = () => {
  const insertHorizontalRule = usePublisher('insertHorizontalRule')
  return (
    <ToolbarButton title="Insert horizontal rule" onClick={insertHorizontalRule.bind(null, true)}>
      <HorizontalRuleIcon />
    </ToolbarButton>
  )
}

export const SandpackButton: React.FC = () => {
  // TODO:
  const insertSandpack = () => {
    throw new Error('')
  }
  // TODO:
  // const [sandpackConfig] = useEmitterValues('sandpackConfig')
  const sandpackConfig: SandpackConfig = { defaultPreset: '', presets: [] }

  return (
    <>
      {sandpackConfig.presets.length === 1 ? (
        <ToolbarButton title="Insert live code block" onClick={insertSandpack.bind(null, '')}>
          <LiveCodeIcon />
        </ToolbarButton>
      ) : (
        <Select.Root value="" onValueChange={insertSandpack}>
          <SelectButtonTrigger title="Insert live code snippet">
            <LiveCodeIcon />
          </SelectButtonTrigger>

          <SelectContent className={styles.toolbarButtonDropdownContainer}>
            {sandpackConfig.presets.map((preset) => (
              <SelectItem key={preset.name} value={preset.meta}>
                {preset.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select.Root>
      )}
    </>
  )
}

export const FrontmatterButton: React.FC = () => {
  const insertFrontmatter = usePublisher('insertFrontmatter')
  return (
    <ToolbarButton title="Insert frontmatter editor" onClick={insertFrontmatter.bind(null, true)}>
      <FrontmatterIcon />
    </ToolbarButton>
  )
}

export const ViewModeSwitch: React.FC = () => {
  const [viewMode] = useEmitterValues('viewMode', 'activeEditorType')
  const setViewMode = usePublisher('viewMode')
  return (
    <ToggleSingleGroup
      aria-label="View Mode"
      onValueChange={(v) => {
        if (v !== '') {
          setViewMode(v as ViewMode)
        }
      }}
      value={viewMode}
      className={styles.toolbarModeSwitch}
    >
      <ToggleItem value="editor" aria-label="Rich text" title="Rich text mode">
        <RichTextIcon />
      </ToggleItem>

      <ToggleItem value="diff" aria-label="View diff" title="Diff mode">
        <DifferenceIcon />
      </ToggleItem>

      <ToggleItem value="markdown" aria-label="View Markdown" title="Markdown source mode">
        <MarkdownIcon />
      </ToggleItem>
    </ToggleSingleGroup>
  )
}

export const ToolbarFlexWhitespace: React.FC = () => {
  return <div style={{ flex: 1 }} />
}

/**
 * A dictionary with all built-in Toolbar components that can be used within the toolbar.
 * @see To customize the toolbar, pass an array of what you need to the {@link MDXEditorProps.toolbarComponents}.
 */
export const ToolbarComponents = {
  BlockTypeSelect,
  BoldItalicUnderlineButtons,
  CodeBlockButton,
  CodeFormattingButton,
  FrontmatterButton,
  GroupGroup,
  HorizontalRuleButton,
  LinkButton,
  ListButtons,
  SandpackButton,
  TableButton,
  ToggleItem,
  ToggleSingleGroup,
  ToggleSingleGroupWithItem,
  ToolbarButton,
  ToolbarSeparator,
  ImageButton,
  DialogButton
}
