import { getRealmFactory, realmFactoryToComponent, system } from '../../gurx'
import {
  $getRoot,
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
import React, { PropsWithChildren } from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $findMatchingParent, $getNearestNodeOfType } from '@lexical/utils'
import {
  $isListNode,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  ListNode,
  ListType,
  REMOVE_LIST_COMMAND,
} from '@lexical/list'
import { BlockType, HeadingType } from '../ToolbarPlugin/BlockTypeSelect'
import { $isAdmonitionNode, AdmonitionKind, AdmonitionNode } from '../../nodes'
import { $isHeadingNode } from '@lexical/rich-text'
import { formatAdmonition, formatCode, formatHeading, formatParagraph, formatQuote } from '../ToolbarPlugin/BlockTypeSelect/blockFormatters'
import { ViewMode } from '../SourcePlugin'
import { AvailableJsxImports, exportMarkdownFromLexical } from '../../export'
import { tap } from '../../utils'
import { importMarkdownToLexical } from '../../import'

type Teardowns = Array<() => void>

const ListTypeCommandMap = new Map<ListType | '', LexicalCommand<void>>([
  ['number', INSERT_ORDERED_LIST_COMMAND],
  ['bullet', INSERT_UNORDERED_LIST_COMMAND],
  ['', REMOVE_LIST_COMMAND],
])

export function getStateAsMarkdown(editor: LexicalEditor, availableImports?: AvailableJsxImports) {
  return tap({ markdown: '' }, (result) => {
    editor.getEditorState().read(() => {
      result.markdown = exportMarkdownFromLexical({ root: $getRoot(), availableImports: availableImports })
    })
  }).markdown
}

export const [EditorSystem, EditorSystemType] = system((r) => {
  const editor = r.node<LexicalEditor | null>(null, true)
  const availableJsxImports = r.node({} as AvailableJsxImports, true)

  const activeEditor = r.node<LexicalEditor | null>(null, true)
  const currentFormat = r.node(0, true)
  const currentSelection = r.node<RangeSelection | null>(null)
  const currentListType = r.node<ListType | null>(null)
  const currentBlockType = r.node<BlockType | AdmonitionKind | null>(null)

  const applyFormat = r.node<TextFormatType>()
  const applyListType = r.node<ListType | ''>()
  const applyBlockType = r.node<BlockType | AdmonitionNode>()

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
    activeEditor,
    r.o.scan((teardowns, newEditor) => {
      teardowns.forEach((u) => u())
      const newTeardowns: Teardowns = []
      if (newEditor) {
        newTeardowns.push(
          newEditor.registerUpdateListener(({ editorState }) => {
            editorState.read(() => {
              handleSelectionChange()
            })
          })
        )
      }
      return newTeardowns
    }, [] as Teardowns)
  )

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
    availableJsxImports,
  }
}, [])

const [ViewModeSystem] = system(
  (r, [{ availableJsxImports, editor }]) => {
    const viewMode = r.node<ViewMode>('editor')
    const markdownSource = r.node('')

    r.sub(
      r.pipe(
        viewMode,
        r.o.scan(
          (prev, next) => {
            return {
              current: prev.next,
              next,
            }
          },
          { current: 'editor' as ViewMode, next: 'editor' as ViewMode }
        ),
        r.o.withLatestFrom(editor, markdownSource, availableJsxImports)
      ),
      ([{ current }, editor, markdownValue, availableJsxImports]) => {
        // we're switching away from the editor, update the source.
        if (current === 'editor') {
          r.pub(markdownSource, getStateAsMarkdown(editor!, availableJsxImports))
        } else if (current === 'markdown') {
          // we're switching away from the markdown editor, convert the source back to lexical nodes.
          editor?.update(() => {
            $getRoot().clear()
            importMarkdownToLexical($getRoot(), markdownValue)
          })
        }
      }
    )

    return {
      viewMode,
      markdownSource,
    }
  },
  [EditorSystemType]
)

export const {
  Component: EditorSystemComponent,
  usePublisher,
  useEmitterValues,
} = realmFactoryToComponent(
  getRealmFactory(EditorSystem, ViewModeSystem),
  {
    required: {
      markdownSource: 'markdownSource',
      availableJsxImports: 'availableJsxImports',
    },
  },
  ({ children }: PropsWithChildren) => {
    return <div>{children}</div>
  }
)

export const CaptureLexicalEditor = () => {
  const setEditor = usePublisher('editor')
  const [lexicalEditor] = useLexicalComposerContext()
  React.useEffect(() => setEditor(lexicalEditor), [lexicalEditor, setEditor])
  return null
}
