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
import * as styles from './styles.css'
import {
  $getRoot,
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
import { OPEN_LINK_DIALOG } from '../LinkDialogPlugin/'
import { formatAdmonition, formatCode, formatHeading, formatParagraph, formatQuote } from './BlockTypeSelect/blockFormatters'
import { BlockType, BlockTypeSelect } from './BlockTypeSelect/'
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
import { $createCodeNode } from '@lexical/code'
import { $isAdmonitionNode, ACTIVE_SANDPACK_COMMAND, ActiveSandpackPayload, AdmonitionKind } from '../../nodes'
import { useMarkdownSource, useViewMode, ViewMode } from '../'
import { importMarkdownToLexical } from '../..'
import { useEmitterValues } from '../System'

const ListTypeCommandMap = new Map<ListType | '', LexicalCommand<void>>([
  ['number', INSERT_ORDERED_LIST_COMMAND],
  ['bullet', INSERT_UNORDERED_LIST_COMMAND],
  ['', REMOVE_LIST_COMMAND],
])

export const ToolbarPlugin = () => {
  const [format] = useEmitterValues('currentFormat')
  const [editor] = useLexicalComposerContext()
  const [activeEditor, setActiveEditor] = React.useState(editor)
  // const [format, setFormat] = React.useState<number>(DEFAULT_FORMAT)
  const [listType, setListType] = React.useState('' as ListType | '')
  const [blockType, setBlockType] = React.useState('' as BlockType | AdmonitionKind | '')
  const [activeCodeBlock, setActiveCodeBlock] = React.useState<string | null>(null)
  const [activeSandpack, setActiveSandpack] = React.useState<ActiveSandpackPayload | null>(null)
  const [viewMode, setViewMode] = useViewMode()
  const [markdownValueRef] = useMarkdownSource()

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

        const type = $isHeadingNode(element)
          ? element.getTag()
          : $isAdmonitionNode(element)
          ? element.getKind()
          : (element.getType() as BlockType)

        setBlockType(type)
      }
    }
  }, [activeEditor])

  React.useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        (_payload, newEditor) => {
          updateToolbar()
          setActiveEditor(newEditor)
          return false
        },
        COMMAND_PRIORITY_CRITICAL
      )
    )
  }, [editor, updateToolbar])

  React.useEffect(() => {
    // something
    activeEditor.getEditorState().read(() => {
      updateToolbar()
    })

    return mergeRegister(
      activeEditor.registerCommand(
        ACTIVE_SANDPACK_COMMAND,
        (activeSandpack) => {
          setActiveSandpack(activeSandpack)
          return true
        },
        COMMAND_PRIORITY_CRITICAL
      ),
      activeEditor.registerCommand(
        FOCUS_COMMAND,
        () => {
          setActiveCodeBlock(null)
          setActiveSandpack(null)
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
  }, [activeEditor, updateToolbar])

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
          const codeBlockNode = $createCodeNode()
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
    (type: BlockType | AdmonitionKind) => {
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
        case 'note':
        case 'tip':
        case 'danger':
        case 'caution':
        case 'info': {
          formatAdmonition(activeEditor, type)
          break
        }
        default: {
          formatHeading(activeEditor, type)
        }
      }
    },
    [activeEditor]
  )

  if (activeSandpack !== null) {
    return <div style={{ height: 64 }}>Sandpack</div>
  }
  if (activeCodeBlock !== null) {
    return (
      <div style={{ height: 64 }}>
        <select
          value={activeCodeBlock}
          onChange={(_e) => {
            // editor.dispatchCommand(SET_CODE_BLOCK_LANGUAGE_COMMAND, { language: e.target.value, nodeKey: activeCodeBlock.nodeKey })
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

      <ToolbarSeparator />
      <RadixToolbar.ToggleGroup
        type="single"
        aria-label="View Mode"
        onValueChange={(newViewMode) =>
          setViewMode((current) => {
            if (current === 'markdown') {
              // don't use active editor - we do it on the root level always.
              editor.update(() => {
                $getRoot().clear()
                importMarkdownToLexical($getRoot(), markdownValueRef.current)
              })
            }

            return ViewModeMap.get(newViewMode)!
          })
        }
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
