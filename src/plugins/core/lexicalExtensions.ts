import { buildEditorFromExtensions, getPeerDependencyFromEditor, InitialStateExtension, NestedEditorExtension } from '@lexical/extension'
import { HistoryExtension, HistoryState, HistoryStateEntry, SharedHistoryExtension } from '@lexical/history'
import { ReactExtension } from '@lexical/react/ReactExtension'
import { ReactProviderExtension } from '@lexical/react/ReactProviderExtension'
import {
  AnyLexicalExtensionArgument,
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  COMMAND_PRIORITY_LOW,
  configExtension,
  CreateEditorArgs,
  defineExtension,
  EditorThemeClasses,
  FOCUS_COMMAND,
  HISTORIC_TAG,
  InitialEditorStateType,
  LineBreakNode,
  LexicalEditor,
  LexicalEditorWithDispose,
  ParagraphNode,
  RootNode,
  TabNode,
  TextNode
} from 'lexical'

export type EditorHistoryMode = 'none' | 'root-shared' | 'nested-shared' | 'nested-external' | 'table-local'

export interface ExtensionEditorConfig {
  name: string
  namespace: string
  nodes: CreateEditorArgs['nodes']
  theme?: EditorThemeClasses
  editable?: boolean
  parentEditor?: LexicalEditor
  historyMode: EditorHistoryMode
  historyState?: HistoryState
  initialEditorState?: InitialEditorStateType
  onError?: (error: Error) => void
}

const editorsWithSharedHistory = new WeakSet<LexicalEditor>()
const editorHistoryStates = new WeakMap<LexicalEditor, HistoryState>()
const extensionBuiltinNodes = new Set<unknown>([RootNode, TextNode, LineBreakNode, TabNode, ParagraphNode])
const meaningfulHistoryEntries = new WeakMap<HistoryState, HistoryStateEntry | null>()

function externalHistoryExtension(historyState: HistoryState) {
  return configExtension(HistoryExtension, {
    createInitialHistoryState: () => historyState,
    disabled: false
  })
}

/** @internal */
export function createExtensionEditor({
  name,
  namespace,
  nodes,
  theme,
  editable = true,
  parentEditor,
  historyMode,
  historyState,
  initialEditorState,
  onError = (error) => {
    throw error
  }
}: ExtensionEditorConfig): LexicalEditorWithDispose {
  const dependencies: AnyLexicalExtensionArgument[] = [
    ReactProviderExtension,
    configExtension(ReactExtension, { contentEditable: null }),
    configExtension(InitialStateExtension, {
      setOptions: { tag: HISTORIC_TAG },
      updateOptions: { tag: HISTORIC_TAG }
    })
  ]

  if (parentEditor) {
    dependencies.push(
      configExtension(NestedEditorExtension, {
        $getParentEditor: () => parentEditor,
        inheritEditableFromParent: true
      })
    )
  }

  if (historyMode === 'nested-shared') {
    dependencies.push(SharedHistoryExtension)
  } else if (historyMode === 'root-shared' || historyMode === 'nested-external') {
    if (!historyState) {
      throw new Error(`${historyMode} requires a historyState`)
    }
    dependencies.push(externalHistoryExtension(historyState))
  } else if (historyMode === 'table-local') {
    dependencies.push(configExtension(HistoryExtension, { disabled: false }))
  }

  const editorExtension = defineExtension({
    name,
    namespace,
    // InitialStateExtension already declares Lexical's built-ins. Filtering
    // them here also prevents Vite's optimized extension bundle from seeing
    // the same built-in constructor through two module facades.
    nodes: nodes?.filter((node) => !extensionBuiltinNodes.has(node)),
    theme,
    editable,
    $initialEditorState: initialEditorState,
    onError,
    dependencies
  })

  const editor = buildEditorFromExtensions(editorExtension)
  const historyDependency = getPeerDependencyFromEditor<typeof HistoryExtension>(editor, HistoryExtension.name)
  const editorHistoryState = historyDependency?.output.historyState.value
  if (editorHistoryState) {
    editorHistoryStates.set(editor, editorHistoryState)
  }

  // Legacy React history plugins registered after the caller's initial
  // import. The configured InitialStateExtension uses HISTORIC_TAG to keep
  // initial root/nested/table content out of Undo and Redo.
  if (editorHistoryState) {
    if (!meaningfulHistoryEntries.has(editorHistoryState)) {
      meaningfulHistoryEntries.set(editorHistoryState, editorHistoryState.current)
    }
  }

  const unregisterHistoryFocusGuard = editorHistoryState
    ? editor.registerUpdateListener(({ dirtyElements, dirtyLeaves, tags }) => {
        const current = editorHistoryState.current
        if (tags.has(HISTORIC_TAG)) {
          meaningfulHistoryEntries.set(editorHistoryState, current)
          return
        }

        if (dirtyElements.size > 0 || dirtyLeaves.size > 0) {
          meaningfulHistoryEntries.set(editorHistoryState, current)
          return
        }

        const meaningfulEntry = meaningfulHistoryEntries.get(editorHistoryState)
        if (current?.editor === editor && meaningfulEntry && meaningfulEntry.editor !== editor) {
          // registerHistory treats a selection-only focus update as a merge,
          // even when it switches editors. Preserve the previous editor's
          // current state as an explicit boundary before accepting the newly
          // focused editor's baseline; otherwise sibling Undo skips edits.
          editorHistoryState.undoStack.push({ ...meaningfulEntry })
          editorHistoryState.redoStack = []
          editor.dispatchCommand(CAN_UNDO_COMMAND, true)
          editor.dispatchCommand(CAN_REDO_COMMAND, false)
          meaningfulHistoryEntries.set(editorHistoryState, current)
        } else {
          meaningfulHistoryEntries.set(editorHistoryState, current)
        }
      })
    : () => undefined
  const availabilityTimers = new Set<ReturnType<typeof setTimeout>>()
  const unregisterHistoryAvailability = editorHistoryState
    ? editor.registerCommand(
        FOCUS_COMMAND,
        () => {
          // Availability commands are emitted by the editor that mutates the
          // shared state. Replay them after active-editor React effects attach
          // so a focus switch observes changes made by a sibling/table editor.
          const timer = setTimeout(() => {
            availabilityTimers.delete(timer)
            editor.dispatchCommand(CAN_UNDO_COMMAND, editorHistoryState.undoStack.length > 0)
            editor.dispatchCommand(CAN_REDO_COMMAND, editorHistoryState.redoStack.length > 0)
          })
          availabilityTimers.add(timer)
          return false
        },
        COMMAND_PRIORITY_LOW
      )
    : () => undefined

  const dispose = editor.dispose.bind(editor)
  let disposed = false
  editor.dispose = () => {
    if (disposed) {
      return
    }
    disposed = true
    availabilityTimers.forEach(clearTimeout)
    availabilityTimers.clear()
    unregisterHistoryAvailability()
    unregisterHistoryFocusGuard()
    dispose()
  }

  if (historyMode === 'root-shared') {
    editorsWithSharedHistory.add(editor)
  }
  return editor
}

/** @internal */
export function editorHasSharedHistory(editor: LexicalEditor): boolean {
  return editorsWithSharedHistory.has(editor)
}

/** @internal */
export function editorUsesHistoryState(editor: LexicalEditor, historyState: HistoryState): boolean {
  return editorHistoryStates.get(editor) === historyState
}
