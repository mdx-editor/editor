import {
  $isListNode,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  ListNode,
  ListType,
  REMOVE_LIST_COMMAND
} from '@lexical/list'
import { $isHeadingNode } from '@lexical/rich-text'
import { $findMatchingParent, $getNearestNodeOfType } from '@lexical/utils'
import {
  $getRoot,
  $getSelection,
  $isRangeSelection,
  $isRootOrShadowRoot,
  BLUR_COMMAND,
  COMMAND_PRIORITY_CRITICAL,
  COMMAND_PRIORITY_LOW,
  FORMAT_TEXT_COMMAND,
  Klass,
  LexicalCommand,
  LexicalEditor,
  LexicalNode,
  PASTE_COMMAND,
  RangeSelection,
  SELECTION_CHANGE_COMMAND,
  TextFormatType
} from 'lexical'
import { system } from '../gurx'
import { $createFrontmatterNode, $isAdmonitionNode, $isFrontmatterNode, AdmonitionKind } from '../nodes'
import { BlockType, HeadingType } from '../ui/ToolbarPlugin/BlockTypeSelect'
import { formatAdmonition, formatHeading, formatParagraph, formatQuote } from '../ui/ToolbarPlugin/BlockTypeSelect/blockFormatters'
import { INSERT_HORIZONTAL_RULE_COMMAND } from '@lexical/react/LexicalHorizontalRuleNode'
import { ActiveEditorType } from '../types/ActiveEditorType'
import { createEmptyHistoryState } from '@lexical/react/LexicalHistoryPlugin'
import { MarkdownParseOptions } from '../import'
import { ExportMarkdownFromLexicalOptions } from '../export/exportMarkdownFromLexical'
import { importMarkdownToLexical } from '../import'
import { CustomLeafDirectiveEditor } from '../types/NodeDecoratorsProps'
import { LeafDirective } from 'mdast-util-directive'

type Teardowns = (() => void)[]

const ListTypeCommandMap = new Map<ListType | '', LexicalCommand<void>>([
  ['number', INSERT_ORDERED_LIST_COMMAND],
  ['bullet', INSERT_UNORDERED_LIST_COMMAND],
  ['', REMOVE_LIST_COMMAND]
])

type EditorSubscription = (activeEditor: LexicalEditor, rootEditor: LexicalEditor) => () => void

export const EditorSystem = system((r) => {
  const editor = r.node<LexicalEditor | null>(null, true)
  const markdownSource = r.node('')
  const setMarkdown = r.node<string>()
  const historyState = r.node(createEmptyHistoryState())
  const activeEditor = r.derive(editor, null)

  const currentFormat = r.node(0, true)
  const currentSelection = r.node<RangeSelection | null>(null)
  const currentListType = r.node<ListType | null>(null)
  const currentBlockType = r.node<BlockType | AdmonitionKind | null>(null)
  const applyFormat = r.node<TextFormatType>()
  const applyListType = r.node<ListType | ''>()
  const applyBlockType = r.node<BlockType | AdmonitionKind>()
  const insertHorizontalRule = r.node<true>()
  const insertTable = r.node<true>()
  const insertFrontmatter = r.node<true>()
  const insertImage = r.node<string>()
  const createEditorSubscription = r.node<EditorSubscription>()
  const editorSubscriptions = r.node<EditorSubscription[]>([])
  const inFocus = r.node(false, true)
  const activeEditorType = r.node<ActiveEditorType>({ type: 'lexical' })
  const editorRootElementRef = r.node<{ current: HTMLDivElement } | null>(null)
  const markdownParseOptions = r.node<Pick<MarkdownParseOptions, 'syntaxExtensions' | 'mdastExtensions' | 'visitors'> | null>(null)
  const customLeafDirectiveEditors = r.node<CustomLeafDirectiveEditor<LeafDirective>[]>([])
  const lexicalConvertOptions = r.node<Pick<
    ExportMarkdownFromLexicalOptions,
    'visitors' | 'toMarkdownOptions' | 'toMarkdownExtensions'
  > | null>(null)
  const lexicalNodes = r.node<Klass<LexicalNode>[]>([])

  const imageAutocompleteSuggestions = r.node<string[]>([])

  const imageUploadHandler = r.node<(image: File) => Promise<string>>((_) => {
    throw new Error('Image upload handling is not implemented')
  })

  r.link(
    r.pipe(
      createEditorSubscription,
      r.o.withLatestFrom(editorSubscriptions),
      r.o.map(([createSubscription, subscriptions]) => {
        return [...subscriptions, createSubscription]
      })
    ),
    editorSubscriptions
  )

  r.sub(r.pipe(setMarkdown, r.o.withLatestFrom(editor, markdownParseOptions)), ([markdown, editor, markdownParseOptions]) => {
    r.pub(markdownSource, markdown)
    editor?.update(() => {
      $getRoot().clear()
      importMarkdownToLexical({
        root: $getRoot(),
        markdown,
        ...markdownParseOptions!
      })
    })
  })

  r.sub(r.pipe(applyListType, r.o.withLatestFrom(activeEditor)), ([listType, theEditor]) => {
    theEditor?.dispatchCommand(ListTypeCommandMap.get(listType)!, undefined)
  })

  r.sub(r.pipe(applyFormat, r.o.withLatestFrom(activeEditor)), ([format, theEditor]) => {
    theEditor?.dispatchCommand(FORMAT_TEXT_COMMAND, format)
  })

  r.sub(r.pipe(insertHorizontalRule, r.o.withLatestFrom(activeEditor)), ([, theEditor]) => {
    theEditor?.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined)
  })

  r.sub(r.pipe(insertFrontmatter, r.o.withLatestFrom(activeEditor)), ([, theEditor]) => {
    theEditor?.update(() => {
      const firstItem = $getRoot().getFirstChild()
      if (!$isFrontmatterNode(firstItem)) {
        const fmNode = $createFrontmatterNode('"": ""')
        if (firstItem) {
          firstItem.insertBefore(fmNode)
        } else {
          $getRoot().append(fmNode)
        }
      }
    })
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

    if (elementDOM !== null) {
      if ($isListNode(element)) {
        const parentList = $getNearestNodeOfType<ListNode>(anchorNode, ListNode)
        const type = parentList ? parentList.getListType() : element.getListType()
        r.pubIn({
          [currentListType.key]: type,
          [currentBlockType.key]: ''
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
          [currentBlockType.key]: blockType
        })
      }
    }
  })

  function handleSelectionChange() {
    const selection = $getSelection()
    if ($isRangeSelection(selection)) {
      r.pubKeys({
        currentSelection: selection,
        currentFormat: selection.format
      })
    }
  }

  r.sub(editor, (theEditor) => {
    if (theEditor) {
      theEditor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        (_, editor) => {
          r.pubIn({
            [activeEditor.key]: editor,
            [inFocus.key]: true
          })
          handleSelectionChange()

          return false
        },
        COMMAND_PRIORITY_CRITICAL
      )
    }
  })

  r.pipe(
    r.combine(editorSubscriptions, activeEditor),
    r.o.scan((teardowns, [editorSubscriptions, activeEditorValue]) => {
      teardowns.forEach((u) => u())
      return activeEditorValue ? editorSubscriptions.map((s) => s(activeEditorValue, r.getValue(editor)!)) : []
    }, [] as Teardowns)
  )

  r.pub(createEditorSubscription, (editor) => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        handleSelectionChange()
      })
    })
  })

  r.pub(createEditorSubscription, (theEditor) => {
    return theEditor.registerCommand(
      BLUR_COMMAND,
      (payload) => {
        const rootEditor = r.getValue(editor)
        const movingOutside = !rootEditor!.getRootElement()?.contains(payload.relatedTarget as Node)
        if (movingOutside) {
          r.pub(inFocus, false)
        }
        return false
      },
      COMMAND_PRIORITY_LOW
    )
  })

  r.pub(createEditorSubscription, (theEditor) => {
    return theEditor.registerCommand(
      PASTE_COMMAND,
      (event: ClipboardEvent) => {
        let cbPayload = Array.from(event.clipboardData?.items || [])
        cbPayload = cbPayload.filter((i) => /image/.test(i.type)) // Strip out the non-image bits

        if (!cbPayload.length || cbPayload.length === 0) {
          return false
        } // If no image was present in the collection, bail.

        const imageUploadHandlerValue = r.getValue(imageUploadHandler)

        Promise.all(cbPayload.map((file) => imageUploadHandlerValue(file.getAsFile()!)))
          .then((urls) => {
            urls.forEach((url) => {
              r.pub(insertImage, url)
            })
          })
          .catch((e) => {
            throw e
          })
        return true
      },
      COMMAND_PRIORITY_CRITICAL
    )
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
    insertHorizontalRule,
    insertFrontmatter,
    insertImage,
    insertTable,
    createEditorSubscription,
    editorSubscriptions,
    activeEditorType,
    inFocus,
    historyState,
    editorRootElementRef,
    markdownParseOptions,
    lexicalConvertOptions,
    lexicalNodes,
    imageAutocompleteSuggestions,
    markdownSource,
    setMarkdown,
    imageUploadHandler,
    customLeafDirectiveEditors
  }
}, [])
