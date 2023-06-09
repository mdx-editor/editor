import * as RadixToolbar from '@radix-ui/react-toolbar'
import classNames from 'classnames'
import React from 'react'
import { useEmitterValues, usePublisher } from '../../system'
import { IS_BOLD, IS_CODE, IS_ITALIC, IS_UNDERLINE } from '../../FormatConstants'
import styles from '../styles.module.css'
import CodeIcon from './icons/code.svg'
import LiveCodeIcon from './icons/deployed_code.svg'
import BoldIcon from './icons/format_bold.svg'
import ItalicIcon from './icons/format_italic.svg'
import BulletedListIcon from './icons/format_list_bulleted.svg'
import NumberedListIcon from './icons/format_list_numbered.svg'
import UnderlinedIcon from './icons/format_underlined.svg'
import FrameSourceIcon from './icons/frame_source.svg'
import FrontmatterIcon from './icons/frontmatter.svg'
import HorizontalRuleIcon from './icons/horizontal_rule.svg'
import LinkIcon from './icons/link.svg'
import TableIcon from './icons/table.svg'
import RichTextIcon from './icons/rich_text.svg'
import MarkdownIcon from './icons/markdown.svg'
import DifferenceIcon from './icons/difference.svg'
import { BlockTypeSelect } from './BlockTypeSelect'
import type { ViewMode } from '../../types/ViewMode'
export { BlockTypeSelect } from './BlockTypeSelect'

export const ToggleItem = React.forwardRef<HTMLButtonElement, RadixToolbar.ToolbarToggleItemProps>(
  ({ className: passedClassName, ...props }, forwardedRef) => {
    return <RadixToolbar.ToggleItem className={classNames(passedClassName, styles.toolbarToggleItem)} {...props} ref={forwardedRef} />
  }
)

export const ToolbarButton = React.forwardRef<HTMLButtonElement, RadixToolbar.ToolbarButtonProps>((props, forwardedRef) => {
  return <RadixToolbar.Button className={styles.toolbarButton} {...props} ref={forwardedRef} />
})

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
  Omit<RadixToolbar.ToolbarToggleGroupSingleProps, 'type'> & { on: boolean }
>(({ on, children, ...props }, forwardedRef) => {
  return (
    <ToggleSingleGroup {...props} value={on ? 'on' : 'off'} ref={forwardedRef}>
      <ToggleItem value="on">{children}</ToggleItem>
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

  return (
    <GroupGroup>
      <ToggleSingleGroupWithItem aria-label="Bold" on={(currentFormat & IS_BOLD) !== 0} onValueChange={applyFormat.bind(null, 'bold')}>
        <BoldIcon />
      </ToggleSingleGroupWithItem>
      <ToggleSingleGroupWithItem
        aria-label="Italic"
        on={(currentFormat & IS_ITALIC) !== 0}
        onValueChange={applyFormat.bind(null, 'italic')}
      >
        <ItalicIcon />
      </ToggleSingleGroupWithItem>
      <ToggleSingleGroupWithItem
        aria-label="Underline"
        on={(currentFormat & IS_UNDERLINE) !== 0}
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
  return (
    <GroupGroup>
      <ToggleSingleGroupWithItem
        aria-label="Inline code"
        on={(currentFormat & IS_CODE) !== 0}
        onValueChange={applyFormat.bind(null, 'code')}
      >
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
        <ToggleItem value="bullet" aria-label="Bulleted list">
          <BulletedListIcon />
        </ToggleItem>
        <ToggleItem value="number" aria-label="Numbered list">
          <NumberedListIcon />
        </ToggleItem>
      </ToggleSingleGroup>
    </GroupGroup>
  )
}

export const LinkButton: React.FC = () => {
  const openLinkEditDialog = usePublisher('openLinkEditDialog')
  return (
    <ToolbarButton onClick={openLinkEditDialog.bind(null, true)}>
      <LinkIcon />
    </ToolbarButton>
  )
}

export const TableButton: React.FC = () => {
  const insertTable = usePublisher('insertTable')
  return (
    <ToolbarButton onClick={insertTable.bind(null, true)}>
      <TableIcon />
    </ToolbarButton>
  )
}

export const CodeBlockButton: React.FC = () => {
  const insertCodeBlock = usePublisher('insertCodeBlock')

  return (
    <ToolbarButton onClick={insertCodeBlock.bind(null, true)}>
      <FrameSourceIcon />
    </ToolbarButton>
  )
}

export const HorizontalRuleButton: React.FC = () => {
  const insertHorizontalRule = usePublisher('insertHorizontalRule')
  return (
    <ToolbarButton onClick={insertHorizontalRule.bind(null, true)}>
      <HorizontalRuleIcon />
    </ToolbarButton>
  )
}

export const SandpackButton: React.FC = () => {
  const insertSandpack = usePublisher('insertSandpack')
  return (
    <ToolbarButton onClick={insertSandpack.bind(null, true)}>
      <LiveCodeIcon />
    </ToolbarButton>
  )
}

export const FrontmatterButton: React.FC = () => {
  const insertFrontmatter = usePublisher('insertFrontmatter')
  return (
    <ToolbarButton onClick={insertFrontmatter.bind(null, true)}>
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
      <ToggleItem value="editor" aria-label="Rich text" title="Rich text">
        <RichTextIcon />
      </ToggleItem>

      <ToggleItem value="diff" aria-label="View diff" title="Diff">
        <DifferenceIcon />
      </ToggleItem>

      <ToggleItem value="markdown" aria-label="View Markdown" title="Markdown">
        <MarkdownIcon />
      </ToggleItem>
    </ToggleSingleGroup>
  )
}

export const ToolbarFlexWhitespace: React.FC = () => {
  return <div style={{ flex: 1 }} />
}

export const ToolbarComponents = {
  BlockTypeSelect,
  BoldItalicUnderlineButtons,
  CodeBlockButton,
  FrontmatterButton,
  GroupGroup,
  HorizontalRuleIcon,
  LinkButton,
  ListButtons,
  SandpackButton,
  TableButton,
  ToggleItem,
  ToggleSingleGroup,
  ToggleSingleGroupWithItem,
  ToolbarButton,
  ToolbarSeparator,
}
