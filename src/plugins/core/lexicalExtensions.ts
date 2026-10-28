import { buildEditorFromExtensions, getPeerDependencyFromEditor, InitialStateExtension, NestedEditorExtension } from '@lexical/extension'
import { HistoryExtension, HistoryState, HistoryStateEntry, SharedHistoryExtension } from '@lexical/history'
import { ReactExtension } from '@lexical/react/ReactExtension'
import { ReactProviderExtension } from '@lexical/react/ReactProviderExtension'
import {
  $getRoot,
  SKIP_DOM_SELECTION_TAG,
  AnyLexicalExtensionArgument,
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  COMMAND_PRIORITY_LOW,
  COMMAND_PRIORITY_HIGH,
  UNDO_COMMAND,
  REDO_COMMAND,
  configExtension,
  CreateEditorArgs,
  defineExtension,
  EditorThemeClasses,
  EditorState,
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
const restoringHistories = new WeakSet<HistoryState>()
const exportedHistoryEntries = new WeakMap<EditorState, HistoryStateEntry>()
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
    ? editor.registerUpdateListener(({ editorState, prevEditorState, dirtyElements, dirtyLeaves, tags }) => {
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
        const exportedEntry = exportedHistoryEntries.get(prevEditorState)
        if (exportedEntry) exportedHistoryEntries.set(editorState, exportedEntry)
        if (exportedEntry?.editor === meaningfulEntry?.editor && exportedEntry?.editorState === meaningfulEntry?.editorState) {
          // This ancestor already contains that exact committed nested state.
          // Its cached nested snapshots restore the same edit on Redo; another
          // context boundary here would make the first Undo a no-op.
          meaningfulHistoryEntries.set(editorHistoryState, current)
          return
        }
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
  let restoresFocus = false
  const preserveNestedFocus = (redo: boolean) => {
    if (!editorHistoryState || restoringHistories.has(editorHistoryState)) return false
    const target = (redo ? editorHistoryState.redoStack : editorHistoryState.undoStack).at(-1)?.editor.getRootElement()
    const root = editor.getRootElement()
    const focused = root?.ownerDocument.activeElement
    if (
      !target ||
      !(focused instanceof HTMLElement) ||
      focused === target ||
      !root?.contains(focused) ||
      focused.getAttribute('contenteditable') !== 'true'
    )
      return false
    const selection = root.ownerDocument.defaultView?.getSelection()
    const range =
      selection?.rangeCount && focused.contains(selection.getRangeAt(0).commonAncestorContainer)
        ? selection.getRangeAt(0).cloneRange()
        : null
    // Lexical restores the saved editor selection before update listeners run.
    // Do not let that transient focus move commit an unrelated nested editor.
    restoringHistories.add(editorHistoryState)
    restoresFocus = true
    const timer = setTimeout(() => {
      availabilityTimers.delete(timer)
      restoringHistories.delete(editorHistoryState)
      restoresFocus = false
      const active = root.ownerDocument.activeElement
      if (!focused.isConnected || (active !== target && active !== focused)) return
      focused.focus({ preventScroll: true })
      if (range?.startContainer.isConnected && range.endContainer.isConnected) {
        selection?.removeAllRanges()
        selection?.addRange(range)
      }
    })
    availabilityTimers.add(timer)
    return false
  }
  const unregisterUndoFocus = editorHistoryState
    ? editor.registerCommand(
        UNDO_COMMAND,
        (_, sourceEditor) => (sourceEditor === editor ? preserveNestedFocus(false) : false),
        COMMAND_PRIORITY_HIGH
      )
    : () => undefined
  const unregisterRedoFocus = editorHistoryState
    ? editor.registerCommand(
        REDO_COMMAND,
        (_, sourceEditor) => (sourceEditor === editor ? preserveNestedFocus(true) : false),
        COMMAND_PRIORITY_HIGH
      )
    : () => undefined
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
    if (restoresFocus && editorHistoryState) restoringHistories.delete(editorHistoryState)
    unregisterUndoFocus()
    unregisterRedoFocus()
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

/** @internal */
export function editorsShareHistory(first: LexicalEditor, second: LexicalEditor): boolean {
  const history = editorHistoryStates.get(first)
  return history !== undefined && history === editorHistoryStates.get(second)
}

/** @internal */
export function ensureEditorHistoryBaseline(editor: LexicalEditor): void {
  const history = editorHistoryStates.get(editor)
  if (history && history.current?.editor !== editor) {
    const exported = history.current && exportedHistoryEntries.get(history.current.editorState)
    if (
      exported?.editor === editor &&
      (exported.editorState === editor.getEditorState() ||
        JSON.stringify(exported.editorState.toJSON()) === JSON.stringify(editor.getEditorState().toJSON()))
    ) {
      // The ancestor's committed snapshot already contains this exact child
      // baseline, and downward reconciliation restores it without a context step.
      return
    }
    // A programmatic edit may arrive before this editor has ever been focused.
    // Let Lexical record its current state through a normal, content-preserving
    // update; never assign to the shared history stacks or move the DOM caret.
    editor.update(
      () => {
        $getRoot().markDirty()
      },
      { discrete: true, tag: SKIP_DOM_SELECTION_TAG }
    )
  }
}

/** @internal */
export function recordEditorHistoryExport(source: LexicalEditor, parent: LexicalEditor): void {
  const history = editorHistoryStates.get(source)
  if (!history || history !== editorHistoryStates.get(parent) || !history.current) return
  const current = history.current
  const exported = exportedHistoryEntries.get(source.getEditorState())
  if (current.editor === source || (exported?.editor === current.editor && exported.editorState === current.editorState)) {
    exportedHistoryEntries.set(parent.getEditorState(), current)
  }
}

/** @internal */
export function isEditorHistoryRestoring(editor: LexicalEditor): boolean {
  const history = editorHistoryStates.get(editor)
  return history !== undefined && restoringHistories.has(history)
}
