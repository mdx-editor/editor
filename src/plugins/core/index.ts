import { realmPlugin } from '../../RealmWithPlugins'
import { InitialEditorStateType } from '@lexical/react/LexicalComposer.js'
import { createEmptyHistoryState } from '@lexical/react/LexicalHistoryPlugin.js'
import { $isHeadingNode, HeadingTagType } from '@lexical/rich-text'
import { $setBlocksType } from '@lexical/selection'
import { $findMatchingParent, $insertNodeToNearestRoot, $wrapNodeInElement } from '@lexical/utils'
import { Cell, NodeRef, Realm, Signal, filter, scan, withLatestFrom } from '@mdxeditor/gurx'
import {
  $createParagraphNode,
  $getRoot,
  $getSelection,
  $insertNodes,
  $isDecoratorNode,
  $isRangeSelection,
  $isRootOrShadowRoot,
  $setSelection,
  BLUR_COMMAND,
  COMMAND_PRIORITY_CRITICAL,
  DecoratorNode,
  ElementNode,
  FOCUS_COMMAND,
  FORMAT_TEXT_COMMAND,
  KEY_DOWN_COMMAND,
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

import { mdxJsxFromMarkdown, mdxJsxToMarkdown } from 'mdast-util-mdx-jsx'
import { mdxJsx } from 'micromark-extension-mdx-jsx'
import { mdxMd } from 'micromark-extension-mdx-md'
import React from 'react'
import { LexicalConvertOptions, exportMarkdownFromLexical } from '../../exportMarkdownFromLexical'
import {
  ImportPoint,
  MarkdownParseError,
  MarkdownParseOptions,
  MdastImportVisitor,
  UnrecognizedMarkdownConstructError,
  importMarkdownToLexical
} from '../../importMarkdownToLexical'
import { controlOrMeta } from '../../utils/detectMac'
import { noop } from '../../utils/fp'
import type { JsxComponentDescriptor } from '../jsx'
import { GenericHTMLNode } from './GenericHTMLNode'
import { type IconKey } from './Icon'
import { LexicalGenericHTMLVisitor } from './LexicalGenericHTMLNodeVisitor'
import { LexicalLinebreakVisitor } from './LexicalLinebreakVisitor'
import { LexicalParagraphVisitor } from './LexicalParagraphVisitor'
import { LexicalRootVisitor } from './LexicalRootVisitor'
import { LexicalTextVisitor } from './LexicalTextVisitor'
import { MdastBreakVisitor } from './MdastBreakVisitor'
import { MdastFormattingVisitor } from './MdastFormattingVisitor'
import { MdastHTMLVisitor } from './MdastHTMLVisitor'
import { MdastInlineCodeVisitor } from './MdastInlineCodeVisitor'
import { MdastParagraphVisitor } from './MdastParagraphVisitor'
import { MdastRootVisitor } from './MdastRootVisitor'
import { MdastTextVisitor } from './MdastTextVisitor'
import { SharedHistoryPlugin } from './SharedHistoryPlugin'
import { DirectiveDescriptor } from '../directives'
import { CodeBlockEditorDescriptor } from '../codeblock'
import { Directives } from 'mdast-util-directive'
export * from './MdastHTMLNode'
export * from './GenericHTMLNode'
export * from './Icon'

/**
 * A function that subscribes to Lexical editor updates or events, and retursns an unsubscribe function.
 * @group Core
 */
export type EditorSubscription = (activeEditor: LexicalEditor) => () => void
type Teardowns = (() => void)[]

/**
 * The type of the block that the current selection is in.
 * @group Core
 */
export type BlockType = 'paragraph' | 'quote' | HeadingTagType | ''

/**
 * The type of the editor being edited currently. Custom editors can override this, so that the toolbar can change its contents.
 * @group Core
 */
export interface EditorInFocus {
  editorType: string
  rootNode: LexicalNode | null
}

/** @internal */
export const NESTED_EDITOR_UPDATED_COMMAND = createCommand<void>('NESTED_EDITOR_UPDATED_COMMAND')

/**
 * Holds a reference to the root Lexical editor instance.
 * @group Core
 */
export const rootEditor$ = Cell<LexicalEditor | null>(null)

/**
 * Holds a reference to the current Lexical editor instance - can be the root editor or a nested editor.
 * @group Core
 */
export const activeEditor$ = Cell<LexicalEditor | null>(null)

/**
 * Holds the CSS class name of the content editable element.
 * @group Core
 */
export const contentEditableClassName$ = Cell('')

/**
 * Holds the readOnly state of the editor.
 * @group Core
 */
export const readOnly$ = Cell(false, (r) => {
  r.sub(r.pipe(readOnly$, withLatestFrom(rootEditor$)), ([readOnly, rootEditor]) => {
    rootEditor?.setEditable(!readOnly)
  })
})

/** @internal */
export const placeholder$ = Cell<React.ReactNode>('')

/** @internal */
export const autoFocus$ = Cell<boolean | { defaultSelection?: 'rootStart' | 'rootEnd'; preventScroll?: boolean }>(false)

/**
 * Holds whether the editor is in focus or not.
 * @group Core
 */
export const inFocus$ = Cell(false)

/**
 * Holds the current format of the selection.
 * @group Core
 */
export const currentFormat$ = Cell(0)

/** @internal */
export const markdownProcessingError$ = Cell<{ error: string; source: string } | null>(null)

/** @internal */
export const markdownErrorSignal$ = Signal<{ error: string; source: string }>((r) => {
  r.link(
    r.pipe(
      markdownProcessingError$,
      filter((e) => e !== null)
    ),
    markdownErrorSignal$
  )
})

/**
 * Applies the published format to the current selection.
 * @group Core
 */
export const applyFormat$ = Signal<TextFormatType>((r) => {
  r.sub(r.pipe(applyFormat$, withLatestFrom(activeEditor$)), ([format, theEditor]) => {
    theEditor?.dispatchCommand(FORMAT_TEXT_COMMAND, format)
  })
})

/**
 * Holds the current selection.
 * @group Core
 */
export const currentSelection$ = Cell<RangeSelection | null>(null, (r) => {
  r.sub(r.pipe(currentSelection$, withLatestFrom(activeEditor$)), ([selection, theEditor]) => {
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
      r.pub(currentBlockType$, blockType)
    }
  })
})

/** @internal */
export const initialMarkdown$ = Cell('')

/**
 * Holds the current markdown value.
 * @group Core
 */
export const markdown$ = Cell('')

/** @internal */
const markdownSignal$ = Signal<string>((r) => {
  r.link(markdown$, markdownSignal$)
  r.link(initialMarkdown$, markdown$)
})

// import configuration
/** @internal */
export const importVisitors$ = Cell<MdastImportVisitor<Mdast.Nodes>[]>([])
/** @internal */
export const syntaxExtensions$ = Cell<MarkdownParseOptions['syntaxExtensions']>([])
/** @internal */
export const mdastExtensions$ = Cell<NonNullable<MarkdownParseOptions['mdastExtensions']>>([])
/** @internal */
export const usedLexicalNodes$ = Cell<Klass<LexicalNode>[]>([])

// export configuration
/** @internal */
export const exportVisitors$ = Cell<NonNullable<LexicalConvertOptions['visitors']>>([])
/** @internal */
export const toMarkdownExtensions$ = Cell<NonNullable<LexicalConvertOptions['toMarkdownExtensions']>>([])
/** @internal */
export const toMarkdownOptions$ = Cell<NonNullable<LexicalConvertOptions['toMarkdownOptions']>>({})

// the JSX plugin will fill in these
/** @internal */
export const jsxIsAvailable$ = Cell(false)

/** @internal */
export const jsxComponentDescriptors$ = Cell<JsxComponentDescriptor[]>([])

/**
 * Contains the currently registered Markdown directive descriptors.
 * @group Directive
 */
export const directiveDescriptors$ = Cell<DirectiveDescriptor<Directives>[]>([])

/**
 * Contains the currently registered code block descriptors.
 * @group Code Block
 */
export const codeBlockEditorDescriptors$ = Cell<CodeBlockEditorDescriptor[]>([])

/**
 * A reference to a DOM element. used for the various popups, dialogs, and tooltips
 * @group Core
 */
export const editorRootElementRef$ = Cell<React.RefObject<HTMLDivElement> | null>(null)

/**
 * Registers a lexical node to be used in the editor.
 * @group Core
 */
export const addLexicalNode$ = Appender(usedLexicalNodes$)

/**
 * Registers a visitor to be used when importing markdown.
 * @group Markdown Processing
 */
export const addImportVisitor$ = Appender(importVisitors$)

/**
 * Adds a syntax extension to the markdown parser.
 * @group Markdown Processing
 */
export const addSyntaxExtension$ = Appender(syntaxExtensions$)

/**
 * Adds a mdast extension to the markdown parser.
 * @group Markdown Processing
 */
export const addMdastExtension$ = Appender(mdastExtensions$)

/**
 * Adds an export visitor to be used when exporting markdown from the Lexical tree.
 * @group Markdown Processing
 */
export const addExportVisitor$ = Appender(exportVisitors$)

/**
 * Adds a markdown to string extension to be used when exporting markdown from the Lexical tree.
 * @group Markdown Processing
 */
export const addToMarkdownExtension$ = Appender(toMarkdownExtensions$)

/**
 * Sets a new markdown value for the editor, replacing the current one.
 * @group Core
 */
export const setMarkdown$ = Signal<string>((r) => {
  r.sub(
    r.pipe(
      setMarkdown$,
      withLatestFrom(markdown$, rootEditor$, inFocus$),
      filter(([newMarkdown, oldMarkdown]) => {
        return newMarkdown.trim() !== oldMarkdown.trim()
      })
    ),
    ([theNewMarkdownValue, , editor, inFocus]) => {
      editor?.update(() => {
        $getRoot().clear()
        tryImportingMarkdown(r, $getRoot(), theNewMarkdownValue)

        if (!inFocus) {
          $setSelection(null)
        } else {
          editor.focus()
        }
      })
    }
  )
})

/**
 * Inserts new markdown value into the current cursor position of the active editor.
 * @group Core
 */
export const insertMarkdown$ = Signal<string>((r) => {
  r.sub(r.pipe(insertMarkdown$, withLatestFrom(activeEditor$, inFocus$)), ([markdownToInsert, editor, inFocus]) => {
    editor?.update(() => {
      const selection = $getSelection()
      if (selection !== null) {
        const importPoint = {
          children: [] as LexicalNode[],
          append(node: LexicalNode) {
            this.children.push(node)
          },
          getType() {
            return selection?.getNodes()[0].getType()
          }
        }

        tryImportingMarkdown(r, importPoint, markdownToInsert)
        $insertNodes(importPoint.children)
      }

      if (!inFocus) {
        $setSelection(null)
      } else {
        editor.focus()
      }
    })
  })
})

function rebind() {
  return scan((teardowns, [subs, activeEditorValue]: [EditorSubscription[], LexicalEditor | null]) => {
    teardowns.forEach((teardown) => {
      if (!teardown) {
        throw new Error('You have a subscription that does not return a teardown')
      }
      teardown()
    })
    return activeEditorValue ? subs.map((s) => s(activeEditorValue)) : []
  }, [] as Teardowns)
}

/** @internal */
export const activeEditorSubscriptions$ = Cell<EditorSubscription[]>([], (r) => {
  r.pipe(r.combine(activeEditorSubscriptions$, activeEditor$), rebind())
})

/** @internal */
export const rootEditorSubscriptions$ = Cell<EditorSubscription[]>([], (r) => {
  r.pipe(r.combine(rootEditorSubscriptions$, rootEditor$), rebind())
})

/**
 * The currently focused editor
 * @group Core
 */
export const editorInFocus$ = Cell<EditorInFocus | null>(null)

/**
 * Emits when the editor loses focus
 * @group Core
 */
export const onBlur$ = Signal<FocusEvent>()

/**
 * A callback that returns the icon component for the given name.
 * @group Core
 */
export const iconComponentFor$ = Cell<(name: IconKey) => React.ReactNode>((name: IconKey) => {
  throw new Error(`No icon component for ${name}`)
})

/** @internal */
export function Appender<T>(cell$: NodeRef<T[]>, init?: (r: Realm, sig$: NodeRef<T | T[]>) => void) {
  return Signal<T | T[]>((r, sig$) => {
    r.changeWith(cell$, sig$, (values, newValue) => {
      if (!Array.isArray(newValue)) {
        newValue = [newValue]
      }
      let result = values

      for (const v of newValue) {
        if (!values.includes(v)) {
          result = [...result, v]
        }
      }
      return result
    })
    init?.(r, sig$)
  })
}

function handleSelectionChange(r: Realm) {
  const selection = $getSelection()
  if ($isRangeSelection(selection)) {
    r.pubIn({
      [currentSelection$]: selection,
      [currentFormat$]: selection.format
    })
  }
}

/**
 * An input signal that lets you register a new {@link EditorSubscription} for the root editor.
 * @example
 * ```tsx
 * realm.pub(createRootEditorSubscription$, (theEditor) => {
 *  return theEditor.registerUpdateListener(() => { ... })
 *  // or a command
 *  // return theEditor.registerCommand('my-command', () => { ... })
 * })
 * ```
 * @group Core
 */
export const createRootEditorSubscription$ = Appender(rootEditorSubscriptions$, (r, sig$) => {
  // track the active editor - this is necessary for the nested editors
  r.pub(sig$, [
    (rootEditor) => {
      return rootEditor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        (_, theActiveEditor) => {
          r.pubIn({
            [activeEditor$]: theActiveEditor,
            [inFocus$]: true
          })
          // doing stuff root editor restores the focus state
          if (theActiveEditor._parentEditor === null) {
            theActiveEditor.getEditorState().read(() => {
              r.pub(editorInFocus$, {
                rootNode: $getRoot(),
                editorType: 'lexical'
              })
            })
          }
          handleSelectionChange(r)

          return false
        },
        COMMAND_PRIORITY_CRITICAL
      )
    },
    // Export handler
    (rootEditor) => {
      return rootEditor.registerUpdateListener(({ dirtyElements, dirtyLeaves, editorState }) => {
        const err = r.getValue(markdownProcessingError$)
        if (err !== null) {
          return
        }
        if (dirtyElements.size === 0 && dirtyLeaves.size === 0) {
          return
        }

        let theNewMarkdownValue!: string

        editorState.read(() => {
          theNewMarkdownValue = exportMarkdownFromLexical({
            root: $getRoot(),
            visitors: r.getValue(exportVisitors$),
            jsxComponentDescriptors: r.getValue(jsxComponentDescriptors$),
            toMarkdownExtensions: r.getValue(toMarkdownExtensions$),
            toMarkdownOptions: r.getValue(toMarkdownOptions$),
            jsxIsAvailable: r.getValue(jsxIsAvailable$)
          })
        })

        r.pub(markdown$, theNewMarkdownValue.trim())
      })
    },
    (rootEditor) => {
      return rootEditor.registerCommand(
        FOCUS_COMMAND,
        () => {
          r.pub(inFocus$, true)
          return false
        },
        COMMAND_PRIORITY_CRITICAL
      )
    },
    // Fixes select all when frontmatter is present
    (rootEditor) => {
      return rootEditor.registerCommand<KeyboardEvent>(
        KEY_DOWN_COMMAND,
        (event) => {
          const { keyCode, ctrlKey, metaKey } = event
          if (keyCode === 65 && controlOrMeta(metaKey, ctrlKey)) {
            let shouldOverride = false

            rootEditor.getEditorState().read(() => {
              shouldOverride = $isDecoratorNode($getRoot().getFirstChild()) || $isDecoratorNode($getRoot().getLastChild())
            })

            if (shouldOverride) {
              event.preventDefault()
              event.stopImmediatePropagation()
              rootEditor.update(() => {
                const rootElement = rootEditor.getRootElement() as HTMLDivElement
                window.getSelection()?.selectAllChildren(rootElement)
                rootElement.focus({
                  preventScroll: true
                })
              })
              return true
            }
          }

          return false
        },
        COMMAND_PRIORITY_CRITICAL
      )
    }
  ])
})

/**
 * An input signal that lets you register a new {@link EditorSubscription} for the active editor.
 * The subscriptions are automatically cleaned up and re-bound when the active editor changes.
 * @example
 * ```tsx
 * realm.pub(createActiveEditorSubscription$, (theEditor) => {
 *  return theEditor.registerUpdateListener(() => { ... })
 *  // or a command
 *  // return theEditor.registerCommand('my-command', () => { ... })
 * })
 * ```
 * @group Core
 */
export const createActiveEditorSubscription$ = Appender(activeEditorSubscriptions$, (r, sig$) => {
  r.pub(sig$, [
    (editor) => {
      return editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          handleSelectionChange(r)
        })
      })
    },
    (editor) => {
      return editor.registerCommand(
        BLUR_COMMAND,
        (payload) => {
          const theRootEditor = r.getValue(rootEditor$)
          if (theRootEditor) {
            const movingOutside = !theRootEditor.getRootElement()?.contains(payload.relatedTarget as Node)
            if (movingOutside) {
              r.pubIn({
                [inFocus$]: false,
                [onBlur$]: payload
              })
            }
          }
          return false
        },
        COMMAND_PRIORITY_CRITICAL
      )
    }
  ])
})

function tryImportingMarkdown(r: Realm, node: ImportPoint, markdownValue: string) {
  try {
    ////////////////////////
    // Import initial value
    ////////////////////////
    importMarkdownToLexical({
      root: node,
      visitors: r.getValue(importVisitors$),
      mdastExtensions: r.getValue(mdastExtensions$),
      markdown: markdownValue,
      syntaxExtensions: r.getValue(syntaxExtensions$),
      jsxComponentDescriptors: r.getValue(jsxComponentDescriptors$),
      directiveDescriptors: r.getValue(directiveDescriptors$),
      codeBlockEditorDescriptors: r.getValue(codeBlockEditorDescriptors$)
    })
    r.pub(markdownProcessingError$, null)
  } catch (e) {
    if (e instanceof MarkdownParseError || e instanceof UnrecognizedMarkdownConstructError) {
      r.pubIn({
        [markdown$]: markdownValue,
        [markdownProcessingError$]: {
          error: e.message,
          source: markdownValue
        }
      })
    } else {
      throw e
    }
  }
}

// gets bound to the root editor state getter
/** @internal */
export const initialRootEditorState$ = Cell<InitialEditorStateType | null>(null, (r) => {
  r.pub(initialRootEditorState$, (theRootEditor) => {
    r.pub(rootEditor$, theRootEditor)
    r.pub(activeEditor$, theRootEditor)

    tryImportingMarkdown(r, $getRoot(), r.getValue(initialMarkdown$))

    const autoFocusValue = r.getValue(autoFocus$)
    if (autoFocusValue) {
      if (autoFocusValue === true) {
        // Default 'on' state
        setTimeout(() => theRootEditor.focus(noop, { defaultSelection: 'rootStart' }))
        return
      }
      setTimeout(() =>
        theRootEditor.focus(noop, {
          defaultSelection: autoFocusValue.defaultSelection ?? 'rootStart'
        })
      )
    }
  })
})

/** @internal */
export const composerChildren$ = Cell<React.ComponentType[]>([])

/**
 * Lets you add React components to the {@link https://lexical.dev/docs/react/plugins | Lexical Composer} element.
 * @group Core
 */
export const addComposerChild$ = Appender(composerChildren$)

/** @internal */
export const topAreaChildren$ = Cell<React.ComponentType[]>([])

/**
 * Lets you add React components on top of the editor (like the toolbar).
 * @group Core
 */
export const addTopAreaChild$ = Appender(topAreaChildren$)

/** @internal */
export const editorWrappers$ = Cell<React.ComponentType<{ children: React.ReactNode }>[]>([])

/**
 * Lets you add React components as wrappers around the editor.
 * @group Core
 */
export const addEditorWrapper$ = Appender(editorWrappers$)

/** @internal */
export const nestedEditorChildren$ = Cell<React.ComponentType[]>([])

/**
 * Lets you add React components as children of any registered nested editor (useful for Lexical plugins).
 * @group Core
 */
export const addNestedEditorChild$ = Appender(nestedEditorChildren$)

/** @internal */
export const historyState$ = Cell(createEmptyHistoryState())

/**
 * Holds the current block type of the selection (i.e. Heading, Paragraph, etc).
 * @group Core
 */
export const currentBlockType$ = Cell<BlockType | ''>('')

/**
 * Allows you to change the block type of the current selection.
 * @group Core
 */
export const applyBlockType$ = Signal<BlockType>()

/**
 * Converts the current selection to a node created by the published factory.
 * @group Core
 */
export const convertSelectionToNode$ = Signal<() => ElementNode>((r) => {
  r.sub(r.pipe(convertSelectionToNode$, withLatestFrom(activeEditor$)), ([factory, editor]) => {
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
})

/**
 * Inserts a decorator node (constructed by the published factory) at the current selection.
 * @group Core
 */
export const insertDecoratorNode$ = Signal<() => DecoratorNode<unknown>>((r) => {
  r.sub(r.pipe(insertDecoratorNode$, withLatestFrom(activeEditor$)), ([nodeFactory, theEditor]) => {
    theEditor?.focus(
      () => {
        theEditor.getEditorState().read(() => {
          const selection = $getSelection()
          if ($isRangeSelection(selection)) {
            const focusNode = selection.focus.getNode()

            if (focusNode !== null) {
              theEditor.update(() => {
                const node = nodeFactory()
                if (node.isInline()) {
                  $insertNodes([node])
                  if ($isRootOrShadowRoot(node.getParentOrThrow())) {
                    $wrapNodeInElement(node, $createParagraphNode).selectEnd()
                  }
                } else {
                  $insertNodeToNearestRoot(node)
                }
                if ('select' in node && typeof node.select === 'function') {
                  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
                  setTimeout(() => node.select())
                }
              })

              setTimeout(() => {
                theEditor.dispatchCommand(NESTED_EDITOR_UPDATED_COMMAND, undefined)
              })
            }
          }
        })
      },
      { defaultSelection: 'rootEnd' }
    )
  })
})

/**
 * The possible view modes of the editor when using the {@link diffSourcePlugin}.
 * @group Diff/Source
 */
export type ViewMode = 'rich-text' | 'source' | 'diff'

/**
 * The current view mode of the editor when using the {@link diffSourcePlugin}.
 * @group Diff/Source
 */
export const viewMode$ = Cell<ViewMode>('rich-text', (r) => {
  function currentNextViewMode() {
    return scan(
      (prev, next: ViewMode) => {
        return {
          current: prev.next,
          next
        }
      },
      { current: 'rich-text' as ViewMode, next: 'rich-text' as ViewMode }
    )
  }
  r.sub(r.pipe(viewMode$, currentNextViewMode(), withLatestFrom(markdownSourceEditorValue$)), ([{ current }, markdownSourceFromEditor]) => {
    if (current === 'source' || current === 'diff') {
      r.pub(setMarkdown$, markdownSourceFromEditor)
    }
  })

  r.sub(
    r.pipe(
      viewMode$,
      currentNextViewMode(),
      filter((mode) => mode.current === 'rich-text'),
      withLatestFrom(activeEditor$)
    ),
    ([, editor]) => {
      editor?.dispatchCommand(NESTED_EDITOR_UPDATED_COMMAND, undefined)
    }
  )
})

/**
 * The current value of the source/diff editors.
 * @group Diff/Source
 */
export const markdownSourceEditorValue$ = Cell('', (r) => {
  r.link(markdown$, markdownSourceEditorValue$)
  r.link(markdownSourceEditorValue$, markdownSignal$)
})

/**
 * The names of the plugins that are currently active.
 * @group Core
 */
export const activePlugins$ = Cell<string[]>([])

/**
 * Add a plugin name to the list of active plugins.
 * @group Core
 */
export const addActivePlugin$ = Appender(activePlugins$)

/** @internal */
export const corePlugin = realmPlugin<{
  initialMarkdown: string
  contentEditableClassName: string
  placeholder?: React.ReactNode
  autoFocus: boolean | { defaultSelection?: 'rootStart' | 'rootEnd'; preventScroll?: boolean | undefined }
  onChange: (markdown: string) => void
  onBlur?: (e: FocusEvent) => void
  onError?: (payload: { error: string; source: string }) => void
  toMarkdownOptions: NonNullable<LexicalConvertOptions['toMarkdownOptions']>
  readOnly: boolean
  iconComponentFor: (name: IconKey) => React.ReactElement
  suppressHtmlProcessing?: boolean
}>({
  init(r, params) {
    r.register(createRootEditorSubscription$)
    r.register(createActiveEditorSubscription$)
    r.register(markdownSignal$)
    r.pubIn({
      [initialMarkdown$]: params?.initialMarkdown.trim(),
      [iconComponentFor$]: params?.iconComponentFor,
      [addImportVisitor$]: [
        MdastRootVisitor,
        MdastParagraphVisitor,
        MdastTextVisitor,
        MdastFormattingVisitor,
        MdastInlineCodeVisitor,
        MdastBreakVisitor
      ],
      [addLexicalNode$]: [ParagraphNode, TextNode, GenericHTMLNode],
      [addExportVisitor$]: [
        LexicalRootVisitor,
        LexicalParagraphVisitor,
        LexicalTextVisitor,
        LexicalLinebreakVisitor,
        LexicalGenericHTMLVisitor
      ],

      [addComposerChild$]: SharedHistoryPlugin,
      [contentEditableClassName$]: params?.contentEditableClassName,
      [toMarkdownOptions$]: params?.toMarkdownOptions,
      [autoFocus$]: params?.autoFocus,
      [placeholder$]: params?.placeholder,
      [readOnly$]: params?.readOnly
    })

    // Use the JSX extension to parse HTML
    if (!params?.suppressHtmlProcessing) {
      r.pubIn({
        [addMdastExtension$]: mdxJsxFromMarkdown(),
        [addSyntaxExtension$]: [mdxJsx(), mdxMd()],
        [addToMarkdownExtension$]: mdxJsxToMarkdown(),
        [addImportVisitor$]: MdastHTMLVisitor
      })
    }
  },

  update(realm, params) {
    realm.pubIn({
      [contentEditableClassName$]: params?.contentEditableClassName,
      [toMarkdownOptions$]: params?.toMarkdownOptions,
      [autoFocus$]: params?.autoFocus,
      [placeholder$]: params?.placeholder,
      [readOnly$]: params?.readOnly
    })

    realm.singletonSub(markdownSignal$, params?.onChange)
    realm.singletonSub(onBlur$, params?.onBlur)
    realm.singletonSub(markdownErrorSignal$, params?.onError)
  }
})
