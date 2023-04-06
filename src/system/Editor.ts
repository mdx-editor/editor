import { $createCodeNode } from '@lexical/code'
import {
  $isListNode,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  ListNode,
  ListType,
  REMOVE_LIST_COMMAND,
} from '@lexical/list'
import { $isHeadingNode } from '@lexical/rich-text'
import { $findMatchingParent, $getNearestNodeOfType, $insertNodeToNearestRoot } from '@lexical/utils'
import {
  $getSelection,
  $isRangeSelection,
  $isRootOrShadowRoot,
  COMMAND_PRIORITY_CRITICAL,
  FORMAT_TEXT_COMMAND,
  LexicalCommand,
  LexicalEditor,
  RangeSelection,
  SELECTION_CHANGE_COMMAND,
  TextFormatType,
} from 'lexical'
import { system } from '../gurx'
import { $isAdmonitionNode, AdmonitionKind } from '../nodes'
import { BlockType, HeadingType } from '../ui/ToolbarPlugin/BlockTypeSelect'
import {
  formatAdmonition,
  formatCode,
  formatHeading,
  formatParagraph,
  formatQuote,
} from '../ui/ToolbarPlugin/BlockTypeSelect/blockFormatters'

type Teardowns = Array<() => void>

const ListTypeCommandMap = new Map<ListType | '', LexicalCommand<void>>([
  ['number', INSERT_ORDERED_LIST_COMMAND],
  ['bullet', INSERT_UNORDERED_LIST_COMMAND],
  ['', REMOVE_LIST_COMMAND],
])

type EditorSubscription = (editor: LexicalEditor) => () => void

export const [EditorSystem, EditorSystemType] = system((r) => {
  const editor = r.node<LexicalEditor | null>(null, true)

  const activeEditor = r.node<LexicalEditor | null>(null, true)
  const currentFormat = r.node(0, true)
  const currentSelection = r.node<RangeSelection | null>(null)
  const currentListType = r.node<ListType | null>(null)
  const currentBlockType = r.node<BlockType | AdmonitionKind | null>(null)
  const applyFormat = r.node<TextFormatType>()
  const applyListType = r.node<ListType | ''>()
  const applyBlockType = r.node<BlockType | AdmonitionKind>()
  const insertCodeBlock = r.node<true>()

  const createEditorSubscription = r.node<EditorSubscription>()
  const editorSubscriptions = r.node<EditorSubscription[]>([])

  r.sub(createEditorSubscription, (createSubscription) => {
    // avoid cyclical dependencies
    const newSubscriptions = [...r.getValue(editorSubscriptions), createSubscription]
    r.pub(editorSubscriptions, newSubscriptions)
  })

  r.sub(editor, (e) => r.pub(activeEditor, e))

  r.sub(r.pipe(insertCodeBlock, r.o.withLatestFrom(activeEditor)), ([, theEditor]) => {
    theEditor?.getEditorState().read(() => {
      const selection = $getSelection()

      if ($isRangeSelection(selection)) {
        const focusNode = selection.focus.getNode()

        if (focusNode !== null) {
          theEditor.update(() => {
            const codeBlockNode = $createCodeNode()
            $insertNodeToNearestRoot(codeBlockNode)
            codeBlockNode.select()
          })
        }
      }
    })
  })

  r.sub(r.pipe(applyListType, r.o.withLatestFrom(activeEditor)), ([listType, theEditor]) => {
    theEditor?.dispatchCommand(ListTypeCommandMap.get(listType)!, undefined)
  })

  r.sub(r.pipe(applyFormat, r.o.withLatestFrom(activeEditor)), ([format, theEditor]) => {
    theEditor?.dispatchCommand(FORMAT_TEXT_COMMAND, format)
  })

  r.sub(r.pipe(applyBlockType, r.o.withLatestFrom(activeEditor)), ([type, theEditor]) => {
    if (theEditor) {
      switch (type) {
        case 'paragraph': {
          formatParagraph(theEditor)
          break
        }
        case 'quote': {
          formatQuote(theEditor)
          break
        }
        case 'code': {
          formatCode(theEditor)
          break
        }
        case 'note':
        case 'tip':
        case 'danger':
        case 'caution':
        case 'info': {
          formatAdmonition(theEditor, type)
          break
        }
        default: {
          formatHeading(theEditor, type as HeadingType)
        }
      }
    }
  })

  r.sub(r.pipe(currentSelection, r.o.withLatestFrom(activeEditor)), ([selection, theEditor]) => {
    if (!selection || !theEditor) {
      return
    }

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
    const elementDOM = theEditor.getElementByKey(elementKey)

    // Update links
    // const node = getSelectedNode(selection);
    // const parent = node.getParent();

    if (elementDOM !== null) {
      if ($isListNode(element)) {
        const parentList = $getNearestNodeOfType<ListNode>(anchorNode, ListNode)
        const type = parentList ? parentList.getListType() : element.getListType()
        r.pubIn({
          [currentListType.key]: type,
          [currentBlockType.key]: '',
        })
      } else {
        r.pub(currentListType, null)

        const blockType = $isHeadingNode(element)
          ? element.getTag()
          : $isAdmonitionNode(element)
          ? element.getKind()
          : (element.getType() as BlockType)

        r.pubIn({
          [currentListType.key]: null,
          [currentBlockType.key]: blockType,
        })
      }
    }
  })

  function handleSelectionChange() {
    const selection = $getSelection()
    if ($isRangeSelection(selection)) {
      r.pubKeys({
        currentSelection: selection,
        currentFormat: selection.format,
      })
    }
  }

  r.sub(editor, (theEditor) => {
    if (theEditor) {
      theEditor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        (_, editor) => {
          r.pub(activeEditor, editor)
          handleSelectionChange()
          return false
        },
        COMMAND_PRIORITY_CRITICAL
      )
    }
  })

  r.pipe(
    r.combine(editorSubscriptions, activeEditor),
    r.o.scan((teardowns, [editorSubscriptions, editor]) => {
      teardowns.forEach((u) => u())
      return editor ? editorSubscriptions.map((s) => s(editor)) : []
    }, [] as Teardowns)
  )

  r.pub(createEditorSubscription, (editor) => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        handleSelectionChange()
      })
    })
  })

  return {
    editor,
    activeEditor,
    currentFormat,
    currentSelection,
    currentListType,
    currentBlockType,
    applyFormat,
    applyListType,
    applyBlockType,
    insertCodeBlock,
    createEditorSubscription,
    editorSubscriptions,
  }
}, [])
