/// <reference types="vite-plugin-svgr/client" />
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { INSERT_HORIZONTAL_RULE_COMMAND } from '@lexical/react/LexicalHorizontalRuleNode'
import { mergeRegister } from '@lexical/utils'
import * as RadixToolbar from '@radix-ui/react-toolbar'
import * as styles from './styles.css'
import { COMMAND_PRIORITY_CRITICAL, SELECTION_CHANGE_COMMAND } from 'lexical'
import React from 'react'
import { OPEN_LINK_DIALOG } from '../LinkDialogPlugin/'
import { BlockTypeSelect } from './BlockTypeSelect/'
import { ReactComponent as BoldIcon } from './icons/format_bold.svg'
import { ReactComponent as ItalicIcon } from './icons/format_italic.svg'
import { ReactComponent as UnderlinedIcon } from './icons/format_underlined.svg'
import { ReactComponent as BulletedListIcon } from './icons/format_list_bulleted.svg'
import { ReactComponent as NumberedListIcon } from './icons/format_list_numbered.svg'
import { ReactComponent as CodeIcon } from './icons/code.svg'
import { ReactComponent as HorizontalRuleIcon } from './icons/horizontal_rule.svg'
import { ReactComponent as LinkIcon } from './icons/link.svg'
import { ReactComponent as FrameSourceIcon } from './icons/frame_source.svg'
import { ReactComponent as LiveCodeIcon } from './icons/deployed_code.svg'
import { ReactComponent as DiffIcon } from './icons/difference.svg'
import { ReactComponent as MarkdownIcon } from './icons/markdown.svg'

import { IS_BOLD, IS_CODE, IS_ITALIC, IS_UNDERLINE } from '../../FormatConstants'
import { ViewMode } from '../'
import { useEmitterValues, usePublisher } from '../../system'

export const ToolbarPlugin = () => {
  const [format, currentListType, viewMode, activeSandpackNode] = useEmitterValues(
    'currentFormat',
    'currentListType',
    'viewMode',
    'activeSandpackNode'
  )
  const applyFormat = usePublisher('applyFormat')
  const applyListType = usePublisher('applyListType')
  const setViewMode = usePublisher('viewMode')
  const insertCodeBlock = usePublisher('insertCodeBlock')
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
    <RadixToolbar.Root className={styles.Root} aria-label="Formatting options">
      <RadixToolbar.ToggleGroup
        type="single"
        aria-label="Text formatting"
        value={format & IS_BOLD ? 'on' : 'off'}
        onValueChange={applyFormat.bind(null, 'bold')}
      >
        <ToolbarToggleItem value="on" aria-label="Bold">
          <BoldIcon />
        </ToolbarToggleItem>
      </RadixToolbar.ToggleGroup>
      <RadixToolbar.ToggleGroup
        type="single"
        aria-label="Text formatting"
        value={format & IS_ITALIC ? 'on' : 'off'}
        onValueChange={applyFormat.bind(null, 'italic')}
      >
        <ToolbarToggleItem value="on" aria-label="Italic">
          <ItalicIcon />
        </ToolbarToggleItem>
      </RadixToolbar.ToggleGroup>
      <RadixToolbar.ToggleGroup
        type="single"
        aria-label="Text formatting"
        value={format & IS_UNDERLINE ? 'on' : 'off'}
        onValueChange={applyFormat.bind(null, 'underline')}
      >
        <ToolbarToggleItem value="on" aria-label="Underlined">
          <UnderlinedIcon style={{ transform: 'translateY(2px)' }} />
        </ToolbarToggleItem>
      </RadixToolbar.ToggleGroup>
      <ToolbarSeparator />
      <RadixToolbar.ToggleGroup
        type="single"
        aria-label="Inline Code"
        value={format & IS_CODE ? 'on' : 'off'}
        onValueChange={applyFormat.bind(null, 'code')}
      >
        <ToolbarToggleItem value="on" aria-label="Inline Code">
          <CodeIcon />
        </ToolbarToggleItem>
      </RadixToolbar.ToggleGroup>
      <ToolbarSeparator />

      <RadixToolbar.ToggleGroup type="single" aria-label="List type" onValueChange={applyListType} value={currentListType || ''}>
        <ToolbarToggleItem value="bullet" aria-label="Bulleted list">
          <BulletedListIcon />
        </ToolbarToggleItem>
        <ToolbarToggleItem value="number" aria-label="Numbered list">
          <NumberedListIcon />
        </ToolbarToggleItem>
      </RadixToolbar.ToggleGroup>

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
        <LiveCodeIcon />
      </ToolbarButton>

      <ToolbarSeparator />
      <RadixToolbar.ToggleGroup
        type="single"
        aria-label="View Mode"
        onValueChange={(newViewMode) => setViewMode(ViewModeMap.get(newViewMode)!)}
        value={viewMode === 'editor' ? '' : viewMode}
      >
        <ToolbarToggleItem value="diff" aria-label="View diff">
          <DiffIcon />
        </ToolbarToggleItem>
        <ToolbarToggleItem value="markdown" aria-label="View Markdown">
          <MarkdownIcon />
        </ToolbarToggleItem>
      </RadixToolbar.ToggleGroup>
    </RadixToolbar.Root>
  )
}

const ViewModeMap = new Map<string, ViewMode>([
  ['diff', 'diff'],
  ['markdown', 'markdown'],
  ['', 'editor'],
])

function ToolbarToggleItem(props: RadixToolbar.ToolbarToggleItemProps) {
  return <RadixToolbar.ToggleItem {...props} className={styles.ToggleItem} />
}

function ToolbarButton(props: RadixToolbar.ToolbarButtonProps) {
  return <RadixToolbar.Button {...props} className={styles.Button} />
}

function ToolbarSeparator() {
  return <RadixToolbar.Separator className={styles.Separator} />
}
