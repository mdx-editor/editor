/// <reference types="vite-plugin-svgr/client" />
import * as RadixToolbar from '@radix-ui/react-toolbar'
import React from 'react'
import { BlockTypeSelect } from './BlockTypeSelect/'
import { ReactComponent as CodeIcon } from './icons/code.svg'
import { ReactComponent as LiveCodeIcon } from './icons/deployed_code.svg'
import { ReactComponent as BoldIcon } from './icons/format_bold.svg'
import { ReactComponent as ItalicIcon } from './icons/format_italic.svg'
import { ReactComponent as BulletedListIcon } from './icons/format_list_bulleted.svg'
import { ReactComponent as NumberedListIcon } from './icons/format_list_numbered.svg'
import { ReactComponent as UnderlinedIcon } from './icons/format_underlined.svg'
import { ReactComponent as FrameSourceIcon } from './icons/frame_source.svg'
import { ReactComponent as HorizontalRuleIcon } from './icons/horizontal_rule.svg'
import { ReactComponent as LinkIcon } from './icons/link.svg'
import { ReactComponent as DeleteIcon } from './icons/delete.svg'
import { CodeBlockLanguageSelect } from './CodeBlockLanguageSelect'

import classnames from 'classnames'
import { IS_BOLD, IS_CODE, IS_ITALIC, IS_UNDERLINE } from '../../FormatConstants'
import { useEmitterValues, usePublisher } from '../../system'
import { buttonClasses, toggleItemClasses } from '../commonCssClasses'
import { $getNodeByKey } from 'lexical'
import { CodeBlockEditorType, SandpackEditorType } from '../../types/ActiveEditorType'
import { CodeBlockNode } from '../../nodes/CodeBlock'
import { SandpackNode } from '../../nodes'
import { ViewMode } from '../SourcePlugin'

export const ToolbarPlugin = () => {
  const [viewMode, activeEditorType] = useEmitterValues('viewMode', 'activeEditorType')
  const setViewMode = usePublisher('viewMode')

  return (
    <RadixToolbar.Root
      className="z-50 mb-6 flex flex-row gap-2 rounded-md border-2 border-solid border-surface-50 p-2 items-center overflow-x-auto sticky top-0 bg-white w-[inherit]"
      aria-label="Formatting options"
    >
      {activeEditorType.type === 'lexical' ? (
        <RichTextButtonSet />
      ) : activeEditorType.type === 'codeblock' ? (
        <CodeBlockButtonSet />
      ) : (
        <SandpackButtonSet />
      )}

      <ToolbarSeparator />
      <ToggleSingleGroup
        aria-label="View Mode"
        onValueChange={(v) => {
          if (v !== '') {
            setViewMode(v as ViewMode)
          }
        }}
        value={viewMode}
        className="ml-auto"
      >
        <ToggleItem value="editor" aria-label="Rich text" className="rounded-l-md">
          Rich Text
        </ToggleItem>

        <ToggleItem value="diff" aria-label="View diff" className="">
          Diff View
        </ToggleItem>

        <ToggleItem value="markdown" aria-label="View Markdown" className="rounded-r-md">
          Markdown
        </ToggleItem>
      </ToggleSingleGroup>
    </RadixToolbar.Root>
  )
}

const ToggleItem = React.forwardRef<HTMLButtonElement, RadixToolbar.ToolbarToggleItemProps>(
  ({ className: passedClassName, ...props }, forwardedRef) => {
    return <RadixToolbar.ToggleItem className={classnames(passedClassName, toggleItemClasses)} {...props} ref={forwardedRef} />
  }
)

const ToolbarButton = React.forwardRef<HTMLButtonElement, RadixToolbar.ToolbarButtonProps>((props, forwardedRef) => {
  return <RadixToolbar.Button className={buttonClasses} {...props} ref={forwardedRef} />
})

const ToggleSingleGroup = React.forwardRef<HTMLDivElement, Omit<RadixToolbar.ToolbarToggleGroupSingleProps, 'type'>>(
  ({ children, className, ...props }, forwardedRef) => {
    return (
      <RadixToolbar.ToggleGroup {...props} type="single" ref={forwardedRef} className={classnames('whitespace-nowrap', className)}>
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

function CodeBlockButtonSet() {
  const [activeEditor, activeEditorType] = useEmitterValues('activeEditor', 'activeEditorType')
  return (
    <>
      <CodeBlockLanguageSelect />

      <ToolbarButton>
        <DeleteIcon
          onClick={() => {
            activeEditor!.update(() => {
              const node = $getNodeByKey((activeEditorType as CodeBlockEditorType).nodeKey) as CodeBlockNode
              node.selectNext()
              node.remove()
            })
          }}
        />
      </ToolbarButton>
    </>
  )
}

function SandpackButtonSet() {
  const [activeEditor, activeEditorType] = useEmitterValues('activeEditor', 'activeEditorType')
  return (
    <>
      <ToolbarButton>
        <DeleteIcon
          onClick={() => {
            activeEditor!.update(() => {
              const node = $getNodeByKey((activeEditorType as SandpackEditorType).nodeKey) as SandpackNode
              node.selectNext()
              node.remove()
            })
          }}
        />
      </ToolbarButton>
    </>
  )
}

function RichTextButtonSet() {
  const [currentFormat, currentListType] = useEmitterValues('currentFormat', 'currentListType')
  const applyFormat = usePublisher('applyFormat')
  const applyListType = usePublisher('applyListType')
  const insertCodeBlock = usePublisher('insertCodeBlock')
  const insertSandpack = usePublisher('insertSandpack')
  const openLinkEditDialog = usePublisher('openLinkEditDialog')
  const insertHorizontalRule = usePublisher('insertHorizontalRule')

  return (
    <>
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
      <ToolbarButton onClick={insertHorizontalRule.bind(null, true)}>
        <HorizontalRuleIcon />
      </ToolbarButton>
      <ToolbarSeparator />

      <ToolbarButton onClick={insertCodeBlock.bind(null, true)}>
        <FrameSourceIcon />
      </ToolbarButton>

      <ToolbarButton onClick={insertSandpack.bind(null, true)}>
        <LiveCodeIcon />
      </ToolbarButton>
    </>
  )
}
