/// <reference types="vite-plugin-svgr/client" />
import {
  $isListNode,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  ListNode,
  ListType,
  REMOVE_LIST_COMMAND,
} from '@lexical/list'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { INSERT_HORIZONTAL_RULE_COMMAND } from '@lexical/react/LexicalHorizontalRuleNode'
import { $isHeadingNode } from '@lexical/rich-text'
import { $findMatchingParent, $getNearestNodeOfType, $insertNodeToNearestRoot, mergeRegister } from '@lexical/utils'
import * as RadixToolbar from '@radix-ui/react-toolbar'
import * as styles from './ToolbarPlugin.css'
import {
  $getSelection,
  $isRangeSelection,
  $isRootOrShadowRoot,
  COMMAND_PRIORITY_CRITICAL,
  COMMAND_PRIORITY_LOW,
  FOCUS_COMMAND,
  FORMAT_TEXT_COMMAND,
  LexicalCommand,
  SELECTION_CHANGE_COMMAND,
} from 'lexical'
import React from 'react'
import { OPEN_LINK_DIALOG } from '../LinkPopupPlugin/LinkPopupPlugin'
import { formatCode, formatHeading, formatParagraph, formatQuote } from '../BlockTypeSelect/blockFormatters'
import { BlockType, BlockTypeSelect } from '../BlockTypeSelect/BlockTypeSelect'
import { ReactComponent as BoldIcon } from '../icons/format_bold.svg'
import { ReactComponent as ItalicIcon } from '../icons/format_italic.svg'
import { ReactComponent as UnderlinedIcon } from '../icons/format_underlined.svg'
import { ReactComponent as BulletedListIcon } from '../icons/format_list_bulleted.svg'
import { ReactComponent as NumberedListIcon } from '../icons/format_list_numbered.svg'
import { ReactComponent as CodeIcon } from '../icons/code.svg'
import { ReactComponent as HorizontalRuleIcon } from '../icons/horizontal_rule.svg'
import { ReactComponent as LinkIcon } from '../icons/link.svg'
import { ReactComponent as FrameSourceIcon } from '../icons/frame_source.svg'
import { ReactComponent as LiveCodeIcon } from '../icons/deployed_code.svg'
import {
  $createCodeBlockNode,
  CODE_BLOCK_ACTIVE_COMMAND,
  FOCUS_CODE_BLOCK_COMMAND,
  SET_CODE_BLOCK_LANGUAGE_COMMAND,
  CodeBlockLanguagePayload,
} from '@virtuoso.dev/lexical-mdx-import-export'

// Text node formatting
export const DEFAULT_FORMAT = 0 as const
export const IS_BOLD = 0b1 as const
export const IS_ITALIC = 0b10 as const
export const IS_STRIKETHROUGH = 0b100 as const
export const IS_UNDERLINE = 0b1000 as const
export const IS_CODE = 0b10000 as const
export const IS_SUBSCRIPT = 0b100000 as const
export const IS_SUPERSCRIPT = 0b1000000 as const
export const IS_HIGHLIGHT = 0b10000000 as const

const ListTypeCommandMap = new Map<ListType | '', LexicalCommand<void>>([
  ['number', INSERT_ORDERED_LIST_COMMAND],
  ['bullet', INSERT_UNORDERED_LIST_COMMAND],
  ['', REMOVE_LIST_COMMAND],
])

export const ToolbarPlugin = () => {
  const [editor] = useLexicalComposerContext()
  const [activeEditor, setActiveEditor] = React.useState(editor)
  const [format, setFormat] = React.useState<number>(DEFAULT_FORMAT)
  const [listType, setListType] = React.useState('' as ListType | '')
  const [blockType, setBlockType] = React.useState('' as BlockType | '')
  const [codeBlockActive, setCodeBlockActive] = React.useState<CodeBlockLanguagePayload | null>(null)

  const updateToolbar = React.useCallback(() => {
    const selection = $getSelection()

    if ($isRangeSelection(selection)) {
      const anchorNode = selection.anchor.getNode()
      let element =
        anchorNode.getKey() === 'root'
          ? anchorNode
          : $findMatchingParent(anchorNode, (e) => {
              const parent = e.getParent()
              return parent !== null && $isRootOrShadowRoot(parent)
            })

      if (element === null) {
        element = anchorNode.getTopLevelElementOrThrow()
      }

      let newFormat = DEFAULT_FORMAT

      if (selection.hasFormat('bold')) {
        newFormat |= IS_BOLD
      }

      if (selection.hasFormat('italic')) {
        newFormat |= IS_ITALIC
      }

      if (selection.hasFormat('underline')) {
        newFormat |= IS_UNDERLINE
      }

      if (selection.hasFormat('code')) {
        newFormat |= IS_CODE
      }

      setFormat(newFormat)

      const elementKey = element.getKey()
      const elementDOM = activeEditor.getElementByKey(elementKey)

      // block type
      if (elementDOM !== null) {
        if ($isListNode(element)) {
          const parentList = $getNearestNodeOfType<ListNode>(anchorNode, ListNode)
          const type = parentList ? parentList.getListType() : element.getListType()
          setListType(type)
        } else {
          setListType('')
        }

        const type = $isHeadingNode(element) ? element.getTag() : (element.getType() as BlockType)
        setBlockType(type)
      }
    }
  }, [activeEditor])

  React.useEffect(() => {
    editor.getEditorState().read(() => {
      updateToolbar()
    })

    return mergeRegister(
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        (_payload, newEditor) => {
          updateToolbar()
          setActiveEditor(newEditor)
          return false
        },
        COMMAND_PRIORITY_CRITICAL
      ),
      editor.registerCommand(
        CODE_BLOCK_ACTIVE_COMMAND,
        (codeBlockActive) => {
          setCodeBlockActive(codeBlockActive)
          return true
        },
        COMMAND_PRIORITY_CRITICAL
      ),
      editor.registerCommand(
        FOCUS_COMMAND,
        () => {
          setCodeBlockActive(null)
          return false
        },
        COMMAND_PRIORITY_LOW
      ),
      activeEditor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          updateToolbar()
        })
      })
    )
  }, [editor, updateToolbar])

  const handleFormatChange = React.useCallback(
    (format: 'bold' | 'italic' | 'underline' | 'code') => {
      activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, format)
    },
    [activeEditor]
  )

  const insertCodeBlock = React.useCallback(() => {
    activeEditor.getEditorState().read(() => {
      const selection = $getSelection()

      if (!$isRangeSelection(selection)) {
        return false
      }

      const focusNode = selection.focus.getNode()

      if (focusNode !== null) {
        activeEditor.update(() => {
          const codeBlockNode = $createCodeBlockNode({ code: '', language: '' })
          $insertNodeToNearestRoot(codeBlockNode)
        })
      }
    })
  }, [activeEditor])

  const handleListTypeChange = React.useCallback(
    (type: ListType | '') => {
      activeEditor.dispatchCommand(ListTypeCommandMap.get(type)!, undefined)
    },
    [activeEditor]
  )

  const handleBlockTypeChange = React.useCallback(
    (type: BlockType) => {
      switch (type) {
        case 'paragraph': {
          formatParagraph(activeEditor)
          break
        }
        case 'quote': {
          formatQuote(activeEditor)
          break
        }
        case 'code': {
          formatCode(activeEditor)
          break
        }
        default: {
          formatHeading(activeEditor, type)
        }
      }
    },
    [activeEditor]
  )

  if (codeBlockActive !== null) {
    return (
      <div style={{ height: 64 }}>
        <select
          value={codeBlockActive.language}
          onChange={(e) => {
            editor.dispatchCommand(SET_CODE_BLOCK_LANGUAGE_COMMAND, { language: e.target.value, nodeKey: codeBlockActive.nodeKey })
          }}
        >
          <option value="js">JavaScript</option>
          <option value="jsx">JavaScript (React)</option>
          <option value="ts">TypeScript</option>
          <option value="tsx">TypeScript (React)</option>
          <option value="css">CSS</option>
        </select>
      </div>
    )
  }

  return (
    <RadixToolbar.Root className={styles.Root} aria-label="Formatting options">
      <RadixToolbar.ToggleGroup
        type="single"
        aria-label="Text formatting"
        value={format & IS_BOLD ? 'on' : 'off'}
        onValueChange={handleFormatChange.bind(null, 'bold')}
      >
        <ToolbarToggleItem value="on" aria-label="Bold">
          <BoldIcon />
        </ToolbarToggleItem>
      </RadixToolbar.ToggleGroup>
      <RadixToolbar.ToggleGroup
        type="single"
        aria-label="Text formatting"
        value={format & IS_ITALIC ? 'on' : 'off'}
        onValueChange={handleFormatChange.bind(null, 'italic')}
      >
        <ToolbarToggleItem value="on" aria-label="Italic">
          <ItalicIcon />
        </ToolbarToggleItem>
      </RadixToolbar.ToggleGroup>
      <RadixToolbar.ToggleGroup
        type="single"
        aria-label="Text formatting"
        value={format & IS_UNDERLINE ? 'on' : 'off'}
        onValueChange={handleFormatChange.bind(null, 'underline')}
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
        onValueChange={handleFormatChange.bind(null, 'code')}
      >
        <ToolbarToggleItem value="on" aria-label="Inline Code">
          <CodeIcon />
        </ToolbarToggleItem>
      </RadixToolbar.ToggleGroup>
      <ToolbarSeparator />

      <RadixToolbar.ToggleGroup type="single" aria-label="List type" onValueChange={handleListTypeChange} value={listType}>
        <ToolbarToggleItem value="bullet" aria-label="Bulleted list">
          <BulletedListIcon />
        </ToolbarToggleItem>
        <ToolbarToggleItem value="number" aria-label="Numbered list">
          <NumberedListIcon />
        </ToolbarToggleItem>
      </RadixToolbar.ToggleGroup>

      <ToolbarSeparator />
      <BlockTypeSelect value={blockType} onValueChange={handleBlockTypeChange} />
      <ToolbarSeparator />

      <ToolbarButton onClick={() => activeEditor.dispatchCommand(OPEN_LINK_DIALOG, undefined)}>
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

      <ToolbarButton onClick={insertCodeBlock}>
        <FrameSourceIcon />
      </ToolbarButton>

      <ToolbarButton>
        <LiveCodeIcon />
      </ToolbarButton>
    </RadixToolbar.Root>
  )
}

function ToolbarToggleItem(props: RadixToolbar.ToolbarToggleItemProps) {
  return <RadixToolbar.ToggleItem {...props} className={styles.ToggleItem} />
}

function ToolbarButton(props: RadixToolbar.ToolbarButtonProps) {
  return <RadixToolbar.Button {...props} className={styles.Button} />
}

function ToolbarSeparator() {
  return <RadixToolbar.Separator className={styles.Separator} />
}
