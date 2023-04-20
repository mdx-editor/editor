/// <reference types="vite-plugin-svgr/client" />
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { INSERT_HORIZONTAL_RULE_COMMAND } from '@lexical/react/LexicalHorizontalRuleNode'
import { mergeRegister } from '@lexical/utils'
import * as RadixToolbar from '@radix-ui/react-toolbar'
import { COMMAND_PRIORITY_CRITICAL, SELECTION_CHANGE_COMMAND } from 'lexical'
import React from 'react'
import { BlockTypeSelect } from './BlockTypeSelect/'
import { ReactComponent as CodeIcon } from './icons/code.svg'
import { ReactComponent as LiveCodeIcon } from './icons/deployed_code.svg'
import { ReactComponent as DiffIcon } from './icons/difference.svg'
import { ReactComponent as BoldIcon } from './icons/format_bold.svg'
import { ReactComponent as ItalicIcon } from './icons/format_italic.svg'
import { ReactComponent as BulletedListIcon } from './icons/format_list_bulleted.svg'
import { ReactComponent as NumberedListIcon } from './icons/format_list_numbered.svg'
import { ReactComponent as UnderlinedIcon } from './icons/format_underlined.svg'
import { ReactComponent as FrameSourceIcon } from './icons/frame_source.svg'
import { ReactComponent as HorizontalRuleIcon } from './icons/horizontal_rule.svg'
import { ReactComponent as LinkIcon } from './icons/link.svg'
import { ReactComponent as MarkdownIcon } from './icons/markdown.svg'

import { ViewMode } from '../'
import { IS_BOLD, IS_CODE, IS_ITALIC, IS_UNDERLINE } from '../../FormatConstants'
import { useEmitterValues, usePublisher } from '../../system'
import classnames from 'classnames'
import { buttonClasses, childSvgClasses, toggleItemClasses } from '../commonCssClasses'

export const ToolbarPlugin = () => {
  const [currentFormat, currentListType, viewMode, activeSandpackNode] = useEmitterValues(
    'currentFormat',
    'currentListType',
    'viewMode',
    'activeSandpackNode'
  )
  const applyFormat = usePublisher('applyFormat')
  const applyListType = usePublisher('applyListType')
  const setViewMode = usePublisher('viewMode')
  const insertCodeBlock = usePublisher('insertCodeBlock')
  const insertSandpack = usePublisher('insertSandpack')
  const openLinkEditDialog = usePublisher('openLinkEditDialog')
  const [editor] = useLexicalComposerContext()
  const [activeEditor, setActiveEditor] = React.useState(editor)

  React.useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        (_payload, newEditor) => {
          setActiveEditor(newEditor)
          return false
        },
        COMMAND_PRIORITY_CRITICAL
      )
    )
  }, [editor])

  if (activeSandpackNode !== null) {
    return <div style={{ height: 64 }}>Sandpack (node: {activeSandpackNode.nodeKey})</div>
  }

  return (
    <RadixToolbar.Root
      className="mb-6 flex flex-row gap-2 rounded-md border-2 border-solid border-surface-50 p-2"
      aria-label="Formatting options"
    >
      <GroupGroup>
        <ToggleSingleGroupWithItem
          className="[&_button]:rounded-l-md"
          aria-label="Bold"
          on={(currentFormat & IS_BOLD) !== 0}
          onValueChange={applyFormat.bind(null, 'bold')}
        >
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
          className="[&_button]:rounded-r-md"
          on={(currentFormat & IS_UNDERLINE) !== 0}
          onValueChange={applyFormat.bind(null, 'underline')}
        >
          <UnderlinedIcon style={{ transform: 'translateY(2px)' }} />
        </ToggleSingleGroupWithItem>
      </GroupGroup>

      <ToolbarSeparator />

      <GroupGroup>
        <ToggleSingleGroupWithItem
          aria-label="Inline code"
          className="[&_button]:rounded-md"
          on={(currentFormat & IS_CODE) !== 0}
          onValueChange={applyFormat.bind(null, 'code')}
        >
          <CodeIcon />
        </ToggleSingleGroupWithItem>
      </GroupGroup>

      <ToolbarSeparator />

      <GroupGroup>
        <ToggleSingleGroup
          aria-label="List type"
          onValueChange={applyListType}
          value={currentListType || ''}
          onFocus={(e) => e.preventDefault()}
        >
          <ToggleItem value="bullet" aria-label="Bulleted list" className="rounded-l-md">
            <BulletedListIcon />
          </ToggleItem>
          <ToggleItem value="number" aria-label="Numbered list" className="rounded-r-md">
            <NumberedListIcon />
          </ToggleItem>
        </ToggleSingleGroup>
      </GroupGroup>

      <ToolbarSeparator />
      <BlockTypeSelect />
      <ToolbarSeparator />

      <ToolbarButton onClick={openLinkEditDialog.bind(null, true)}>
        <LinkIcon />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => {
          activeEditor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined)
        }}
      >
        <HorizontalRuleIcon />
      </ToolbarButton>
      <ToolbarSeparator />

      <ToolbarButton onClick={insertCodeBlock.bind(null, true)}>
        <FrameSourceIcon />
      </ToolbarButton>

      <ToolbarButton>
        <LiveCodeIcon onClick={insertSandpack.bind(null, true)} />
      </ToolbarButton>

      <ToolbarSeparator />
      <ToggleSingleGroup
        aria-label="View Mode"
        onValueChange={(newViewMode) => setViewMode(ViewModeMap.get(newViewMode)!)}
        value={viewMode === 'editor' ? '' : viewMode}
      >
        <ToggleItem value="diff" aria-label="View diff" className="rounded-l-md">
          <DiffIcon />
        </ToggleItem>

        <ToggleItem value="markdown" aria-label="View Markdown" className="rounded-r-md">
          <MarkdownIcon />
        </ToggleItem>
      </ToggleSingleGroup>
    </RadixToolbar.Root>
  )
}

const ViewModeMap = new Map<string, ViewMode>([
  ['diff', 'diff'],
  ['markdown', 'markdown'],
  ['', 'editor'],
])

const ToggleItem = React.forwardRef<HTMLButtonElement, RadixToolbar.ToolbarToggleItemProps>(
  ({ className: passedClassName, ...props }, forwardedRef) => {
    return <RadixToolbar.ToggleItem className={classnames(passedClassName, toggleItemClasses)} {...props} ref={forwardedRef} />
  }
)

const ToolbarButton = React.forwardRef<HTMLButtonElement, RadixToolbar.ToolbarButtonProps>((props, forwardedRef) => {
  return <RadixToolbar.Button className={buttonClasses} {...props} ref={forwardedRef} />
})

const ToggleSingleGroup = React.forwardRef<HTMLDivElement, Omit<RadixToolbar.ToolbarToggleGroupSingleProps, 'type'>>(
  ({ children, ...props }, forwardedRef) => {
    return (
      <RadixToolbar.ToggleGroup {...props} type="single" ref={forwardedRef}>
        {children}
      </RadixToolbar.ToggleGroup>
    )
  }
)

const ToggleSingleGroupWithItem = React.forwardRef<
  HTMLDivElement,
  Omit<RadixToolbar.ToolbarToggleGroupSingleProps, 'type'> & { on: boolean }
>(({ on, children, ...props }, forwardedRef) => {
  return (
    <ToggleSingleGroup {...props} value={on ? 'on' : 'off'} ref={forwardedRef}>
      <ToggleItem value="on">{children}</ToggleItem>
    </ToggleSingleGroup>
  )
})

const GroupGroup: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <div className="group flex flex-row gap-[1px] rounded-md">{children}</div>
}

const ToolbarSeparator = React.forwardRef<HTMLDivElement, RadixToolbar.SeparatorProps>(() => {
  return <RadixToolbar.Separator className="mx-1" />
})
