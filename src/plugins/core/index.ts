import { InitialEditorStateType } from '@lexical/react/LexicalComposer'
import { createEmptyHistoryState } from '@lexical/react/LexicalHistoryPlugin'
import { $isHeadingNode, HeadingTagType } from '@lexical/rich-text'
import { $setBlocksType } from '@lexical/selection'
import { $findMatchingParent, $insertNodeToNearestRoot } from '@lexical/utils'
import {
  $getRoot,
  $getSelection,
  $isRangeSelection,
  $isRootOrShadowRoot,
  BLUR_COMMAND,
  COMMAND_PRIORITY_CRITICAL,
  DecoratorNode,
  ElementNode,
  FORMAT_TEXT_COMMAND,
  Klass,
  LexicalEditor,
  LexicalNode,
  ParagraphNode,
  RangeSelection,
  SELECTION_CHANGE_COMMAND,
  TextFormatType,
  TextNode,
  createCommand
} from 'lexical'
import * as Mdast from 'mdast'
import React from 'react'
import { LexicalConvertOptions, exportMarkdownFromLexical } from '../../exportMarkdownFromLexical'
import { RealmNode, realmPlugin, system } from '../../gurx'
import { MarkdownParseOptions, MdastImportVisitor, importMarkdownToLexical } from '../../importMarkdownToLexical'
import type { JsxComponentDescriptor } from '../jsx'
import { LexicalLinebreakVisitor } from './LexicalLinebreakVisitor'
import { LexicalParagraphVisitor } from './LexicalParagraphVisitor'
import { LexicalRootVisitor } from './LexicalRootVisitor'
import { LexicalTextVisitor } from './LexicalTextVisitor'
import { MdastFormattingVisitor } from './MdastFormattingVisitor'
import { MdastInlineCodeVisitor } from './MdastInlineCodeVisitor'
import { MdastParagraphVisitor } from './MdastParagraphVisitor'
import { MdastRootVisitor } from './MdastRootVisitor'
import { MdastTextVisitor } from './MdastTextVisitor'
import { SharedHistoryPlugin } from './SharedHistoryPlugin'

export type EditorSubscription = (activeEditor: LexicalEditor) => () => void
type Teardowns = (() => void)[]

export type BlockType = 'paragraph' | 'quote' | HeadingTagType | ''

export interface EditorInFocus {
  editorType: string
  rootNode: LexicalNode | null
}

export const NESTED_EDITOR_UPDATED_COMMAND = createCommand<void>('NESTED_EDITOR_UPDATED_COMMAND')

const fooSystem = system((r) => {
  const foo = r.node('foo')
  return { foo }
})

export const coreSystem = system((r) => {
  function createAppendNodeFor<T>(node: RealmNode<T[]>) {
    const appendNode = r.node<T>()

    r.link(
      r.pipe(
        appendNode,
        r.o.withLatestFrom(node),
        r.o.map(([newValue, values]) => {
          if (values.includes(newValue)) {
            return values
          }
          return [...values, newValue]
        })
      ),
      node
    )
    return appendNode
  }

  const rootEditor = r.node<LexicalEditor | null>(null)
  const activeEditor = r.node<LexicalEditor | null>(null, true)
  const contentEditableClassName = r.node<string>('')
  const inFocus = r.node(false, true)
  const currentFormat = r.node(0, true)

  const applyFormat = r.node<TextFormatType>()
  const currentSelection = r.node<RangeSelection | null>(null)

  const activeEditorSubscriptions = r.node<EditorSubscription[]>([])
  const rootEditorSubscriptions = r.node<EditorSubscription[]>([])
  const editorInFocus = r.node<EditorInFocus | null>(null)

  const rebind = () =>
    r.o.scan((teardowns, [subs, activeEditorValue]: [EditorSubscription[], LexicalEditor]) => {
      teardowns.forEach((teardown) => {
        if (!teardown) {
          throw new Error('You have a subscription that does not return a teardown')
        }
        teardown()
      })
      return activeEditorValue ? subs.map((s) => s(activeEditorValue)) : []
    }, [] as Teardowns)

  r.pipe(r.combine(activeEditorSubscriptions, activeEditor), rebind())
  r.pipe(r.combine(rootEditorSubscriptions, rootEditor), rebind())

  const createRootEditorSubscription = createAppendNodeFor(rootEditorSubscriptions)
  const createActiveEditorSubscription = createAppendNodeFor(activeEditorSubscriptions)

  function handleSelectionChange() {
    const selection = $getSelection()
    if ($isRangeSelection(selection)) {
      r.pubKeys({
        currentSelection: selection,
        currentFormat: selection.format
      })
    }
  }

  ////////////////////////
  // track the active editor - this is necessary for the nested editors
  ////////////////////////
  r.pub(createRootEditorSubscription, (theRootEditor) => {
    return theRootEditor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      (_, theActiveEditor) => {
        r.pubIn({
          [activeEditor.key]: theActiveEditor,
          [inFocus.key]: true
        })
        // doing stuff root editor restores the focus state
        if (theActiveEditor._parentEditor === null) {
          theActiveEditor.getEditorState().read(() => {
            r.pub(editorInFocus, {
              rootNode: $getRoot(),
              editorType: 'lexical'
            })
          })
        }
        handleSelectionChange()

        return false
      },
      COMMAND_PRIORITY_CRITICAL
    )
  })

  // Export handler
  r.pub(createRootEditorSubscription, (theRootEditor) => {
    return theRootEditor.registerUpdateListener(({ dirtyElements, dirtyLeaves, editorState }) => {
      if (dirtyElements.size === 0 && dirtyLeaves.size === 0) {
        return
      }

      let theNewMarkdownValue!: string

      editorState.read(() => {
        theNewMarkdownValue = exportMarkdownFromLexical({
          root: $getRoot(),
          visitors: r.getValue(exportVisitors),
          jsxComponentDescriptors: r.getValue(jsxComponentDescriptors),
          toMarkdownExtensions: r.getValue(toMarkdownExtensions),
          toMarkdownOptions: r.getValue(toMarkdownOptions),
          jsxIsAvailable: r.getValue(jsxIsAvailable)
        })
      })

      r.pub(markdown, theNewMarkdownValue.trim())
    })
  })

  const initialMarkdown = r.node<string>('')
  const markdown = r.node<string>('', true)
  r.link(initialMarkdown, markdown)

  // import configuration
  const importVisitors = r.node<MdastImportVisitor<Mdast.Content>[]>([])
  const syntaxExtensions = r.node<MarkdownParseOptions['syntaxExtensions']>([])
  const mdastExtensions = r.node<MarkdownParseOptions['mdastExtensions']>([])

  const usedLexicalNodes = r.node<Klass<LexicalNode>[]>([])

  // export configuration
  const exportVisitors = r.node<NonNullable<LexicalConvertOptions['visitors']>>([])
  const toMarkdownExtensions = r.node<NonNullable<LexicalConvertOptions['toMarkdownExtensions']>>([])
  const toMarkdownOptions = r.node<NonNullable<LexicalConvertOptions['toMarkdownOptions']>>({}, true)

  // the JSX plugin will fill in these
  const jsxIsAvailable = r.node<boolean>(false)
  const jsxComponentDescriptors = r.node<JsxComponentDescriptor[]>([])

  // used for the various popups, dialogs, and tooltips
  const editorRootElementRef = r.node<React.RefObject<HTMLDivElement> | null>(null)

  const addLexicalNode = createAppendNodeFor(usedLexicalNodes)
  const addImportVisitor = createAppendNodeFor(importVisitors)
  const addSyntaxExtension = createAppendNodeFor(syntaxExtensions)
  const addMdastExtension = createAppendNodeFor(mdastExtensions)
  const addExportVisitor = createAppendNodeFor(exportVisitors)
  const addToMarkdownExtension = createAppendNodeFor(toMarkdownExtensions)
  const setMarkdown = r.node<string>()

  r.sub(
    r.pipe(setMarkdown, r.o.withLatestFrom(rootEditor, importVisitors, mdastExtensions, syntaxExtensions)),
    ([theNewMarkdownValue, editor, importVisitors, mdastExtensions, syntaxExtensions]) => {
      editor?.update(() => {
        $getRoot().clear()
        importMarkdownToLexical({
          root: $getRoot(),
          visitors: importVisitors,
          mdastExtensions,
          markdown: theNewMarkdownValue,
          syntaxExtensions
        })
      })
    }
  )

  // gets bound to the root editor state getter
  const initialRootEditorState = r.node<InitialEditorStateType>((theRootEditor) => {
    r.pub(rootEditor, theRootEditor)
    r.pub(activeEditor, theRootEditor)

    ////////////////////////
    // Import initial value
    ////////////////////////
    importMarkdownToLexical({
      root: $getRoot(),
      visitors: r.getValue(importVisitors),
      mdastExtensions: r.getValue(mdastExtensions),
      markdown: r.getValue(initialMarkdown),
      syntaxExtensions: r.getValue(syntaxExtensions)
    })
  })

  r.pub(createActiveEditorSubscription, (editor) => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        handleSelectionChange()
      })
    })
  })

  r.pub(createActiveEditorSubscription, (theEditor) => {
    return theEditor.registerCommand(
      BLUR_COMMAND,
      (payload) => {
        const theRootEditor = r.getValue(rootEditor)
        if (theRootEditor) {
          const movingOutside = !theRootEditor.getRootElement()?.contains(payload.relatedTarget as Node)
          if (movingOutside) {
            r.pub(inFocus, false)
          }
        }
        return false
      },
      COMMAND_PRIORITY_CRITICAL
    )
  })

  const composerChildren = r.node<React.ComponentType[]>([])
  const addComposerChild = createAppendNodeFor(composerChildren)

  const topAreaChildren = r.node<React.ComponentType[]>([])
  const addTopAreaChild = createAppendNodeFor(topAreaChildren)

  const editorWrappers = r.node<React.ComponentType<{ children: React.ReactNode }>[]>([])
  const addEditorWrapper = createAppendNodeFor(editorWrappers)

  const nestedEditorChildren = r.node<React.ComponentType[]>([])
  const addNestedEditorChild = createAppendNodeFor(nestedEditorChildren)

  const historyState = r.node(createEmptyHistoryState())

  r.sub(r.pipe(applyFormat, r.o.withLatestFrom(activeEditor)), ([format, theEditor]) => {
    theEditor?.dispatchCommand(FORMAT_TEXT_COMMAND, format)
  })

  const currentBlockType = r.node<BlockType | ''>('')
  const applyBlockType = r.node<BlockType>()

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
      const blockType = $isHeadingNode(element) ? element.getTag() : (element.getType() as BlockType)
      r.pub(currentBlockType, blockType)
    }
  })

  const convertSelectionToNode = r.node<() => ElementNode>()

  r.sub(r.pipe(convertSelectionToNode, r.o.withLatestFrom(activeEditor)), ([factory, editor]) => {
    editor?.update(() => {
      const selection = $getSelection()
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, factory)
        setTimeout(() => {
          editor.focus()
        })
      }
    })
  })

  const insertDecoratorNode = r.node<() => DecoratorNode<unknown>>()

  r.sub(r.pipe(insertDecoratorNode, r.o.withLatestFrom(activeEditor)), ([nodeFactory, theEditor]) => {
    theEditor?.focus(
      () => {
        theEditor.getEditorState().read(() => {
          const selection = $getSelection()
          if ($isRangeSelection(selection)) {
            const focusNode = selection.focus.getNode()

            if (focusNode !== null) {
              theEditor.update(() => {
                const node = nodeFactory()
                $insertNodeToNearestRoot(node)
                if (Object.hasOwn(node, 'select') && typeof node.select === 'function') {
                  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
                  setTimeout(() => node.select(), 80)
                }
              })
            }
          }
        })
      },
      { defaultSelection: 'rootEnd' }
    )
  })

  return {
    // state
    activeEditor,
    inFocus,
    historyState,
    currentSelection,

    // jsx
    jsxIsAvailable,
    jsxComponentDescriptors,

    // lexical editor
    initialRootEditorState,
    rootEditor,
    createRootEditorSubscription,
    createActiveEditorSubscription,

    // import
    importVisitors,
    syntaxExtensions,
    mdastExtensions,
    usedLexicalNodes,
    addImportVisitor,
    addLexicalNode,
    addSyntaxExtension,
    addMdastExtension,

    // export
    toMarkdownExtensions,
    toMarkdownOptions,
    addToMarkdownExtension,
    addExportVisitor,
    exportVisitors,

    // markdown strings
    initialMarkdown,
    setMarkdown,
    markdown,

    // DOM
    editorRootElementRef,
    contentEditableClassName,

    // child controls
    composerChildren,
    addComposerChild,

    topAreaChildren,
    addTopAreaChild,

    nestedEditorChildren,
    addNestedEditorChild,

    editorWrappers,
    addEditorWrapper,

    // editor content state and commands
    currentFormat,
    editorInFocus,
    applyFormat,
    currentBlockType,
    applyBlockType,
    convertSelectionToNode,
    insertDecoratorNode
  }
}, [])

interface CorePluginParams {
  initialMarkdown: string
  contentEditableClassName: string
  onChange: (markdown: string) => void
  toMarkdownOptions: NonNullable<LexicalConvertOptions['toMarkdownOptions']>
}

export const [
  /** @internal */
  corePlugin,
  /** @internal */
  corePluginHooks
] = realmPlugin({
  id: 'core',
  systemSpec: coreSystem,

  applyParamsToSystem(realm, params: CorePluginParams) {
    realm.pubKey('contentEditableClassName', params.contentEditableClassName)
    realm.pubKey('toMarkdownOptions', params.toMarkdownOptions)
    realm.singletonSubKey('markdown', params.onChange)
  },

  init(realm, params: CorePluginParams) {
    realm.pubKey('initialMarkdown', params.initialMarkdown.trim())

    // core import visitors
    realm.pubKey('addImportVisitor', MdastRootVisitor)
    realm.pubKey('addImportVisitor', MdastParagraphVisitor)
    realm.pubKey('addImportVisitor', MdastTextVisitor)
    realm.pubKey('addImportVisitor', MdastFormattingVisitor)
    realm.pubKey('addImportVisitor', MdastInlineCodeVisitor)

    // basic lexical nodes
    realm.pubKey('addLexicalNode', ParagraphNode)
    realm.pubKey('addLexicalNode', TextNode)

    // core export visitors
    realm.pubKey('addExportVisitor', LexicalRootVisitor)
    realm.pubKey('addExportVisitor', LexicalParagraphVisitor)
    realm.pubKey('addExportVisitor', LexicalTextVisitor)
    realm.pubKey('addExportVisitor', LexicalLinebreakVisitor)
    realm.pubKey('addComposerChild', SharedHistoryPlugin)
  }
})
