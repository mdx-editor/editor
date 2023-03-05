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
import { $findMatchingParent, $getNearestNodeOfType, mergeRegister } from '@lexical/utils'
import { blackA, mauve, violet } from '@radix-ui/colors'
import {
  CodeIcon,
  DividerHorizontalIcon,
  FontBoldIcon,
  FontItalicIcon,
  ImageIcon,
  Link1Icon,
  ListBulletIcon,
  UnderlineIcon,
} from '@radix-ui/react-icons'
import * as RadixToolbar from '@radix-ui/react-toolbar'
import { styled } from '@stitches/react'
import {
  $getSelection,
  $isRangeSelection,
  $isRootOrShadowRoot,
  COMMAND_PRIORITY_CRITICAL,
  FORMAT_TEXT_COMMAND,
  LexicalCommand,
  SELECTION_CHANGE_COMMAND,
} from 'lexical'
import React from 'react'
import { OPEN_LINK_DIALOG } from './LinkPopupPlugin'
import { formatCode, formatHeading, formatParagraph, formatQuote } from './blockFormatters'
import { BlockType, BlockTypeSelect } from './toolbar/BlockTypeSelect'
import { NumberedListIcon } from './toolbar/NumberedListIcon'

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

      console.log('element', element)

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
        // console.log(type)

        //          if ($isCodeNode(element)) {
        //            const language = element.getLanguage() as keyof typeof CODE_LANGUAGE_MAP
        //            setCodeLanguage(language ? CODE_LANGUAGE_MAP[language] || language : '')
        //            return
        //          }
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

  return (
    <ToolbarRoot aria-label="Formatting options">
      <RadixToolbar.ToggleGroup
        type="single"
        aria-label="Text formatting"
        value={format & IS_BOLD ? 'on' : 'off'}
        onValueChange={handleFormatChange.bind(null, 'bold')}
      >
        <ToolbarToggleItem value="on" aria-label="Bold">
          <FontBoldIcon />
        </ToolbarToggleItem>
      </RadixToolbar.ToggleGroup>
      <RadixToolbar.ToggleGroup
        type="single"
        aria-label="Text formatting"
        value={format & IS_ITALIC ? 'on' : 'off'}
        onValueChange={handleFormatChange.bind(null, 'italic')}
      >
        <ToolbarToggleItem value="on" aria-label="Italic">
          <FontItalicIcon />
        </ToolbarToggleItem>
      </RadixToolbar.ToggleGroup>
      <RadixToolbar.ToggleGroup
        type="single"
        aria-label="Text formatting"
        value={format & IS_UNDERLINE ? 'on' : 'off'}
        onValueChange={handleFormatChange.bind(null, 'underline')}
      >
        <ToolbarToggleItem value="on" aria-label="Underline">
          <UnderlineIcon />
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
          <ListBulletIcon />
        </ToolbarToggleItem>
        <ToolbarToggleItem value="number" aria-label="Numbered list">
          <NumberedListIcon />
        </ToolbarToggleItem>
      </RadixToolbar.ToggleGroup>

      <ToolbarSeparator />
      <BlockTypeSelect value={blockType} onValueChange={handleBlockTypeChange} />
      <ToolbarSeparator />

      <ToolbarButton onClick={() => activeEditor.dispatchCommand(OPEN_LINK_DIALOG, undefined)}>
        <Link1Icon />
      </ToolbarButton>
      <ToolbarButton>
        <ImageIcon />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => {
          activeEditor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined)
        }}
      >
        <DividerHorizontalIcon />
      </ToolbarButton>
    </ToolbarRoot>
  )
}

const ToolbarRoot = styled(RadixToolbar.Root, {
  boxSizing: 'border-box',
  display: 'flex',
  padding: 10,
  width: '100%',
  minWidth: 'max-content',
  borderRadius: 6,
  backgroundColor: 'white',
  boxShadow: `0 2px 10px ${blackA.blackA7}`,
  alignItems: 'center',
})

const itemStyles = {
  all: 'unset',
  flex: '0 0 auto',
  color: mauve.mauve11,
  height: 25,
  padding: '0 5px',
  borderRadius: 4,
  display: 'inline-flex',
  fontSize: 13,
  lineHeight: 1,
  alignItems: 'center',
  justifyContent: 'center',
  '&:hover': { backgroundColor: violet.violet3, color: violet.violet11 },
  '&:active:hover': { backgroundColor: violet.violet6, transform: 'translateY(1px)' },
  '&:focus': { position: 'relative', boxShadow: `0 0 0 2px ${violet.violet7}` },
}

const ToolbarToggleItem = styled(RadixToolbar.ToggleItem, {
  ...itemStyles,
  backgroundColor: 'white',
  marginLeft: 2,
  '&:first-child': { marginLeft: 0 },
  '&[data-state=on]': { backgroundColor: violet.violet5, color: violet.violet11 },
})

const ToolbarSeparator = styled(RadixToolbar.Separator, {
  width: 1,
  backgroundColor: mauve.mauve6,
  margin: '0 10px',
  alignSelf: 'stretch',
})

const ToolbarButton = styled(RadixToolbar.Button, {
  ...itemStyles,
  color: mauve.mauve11,
  backgroundColor: 'white',
})
