import { EditorState, Extension, type EditorStateConfig } from '@codemirror/state'
import { history, historyField } from '@codemirror/commands'
import { EditorView } from '@codemirror/view'
import { ViewMode, addEditorWrapper$, insertMarkdownHandler$, markdownSourceEditorValue$, viewMode$ } from '../core'
import { DiffSourceWrapper } from './DiffSourceWrapper'
import { Cell, type Realm } from '@mdxeditor/gurx'
import { realmPlugin } from '../../RealmWithPlugins'

/** @internal */
export const diffMarkdown$ = Cell('')

/** @internal */
export const cmExtensions$ = Cell<Extension[]>([])

/** @internal */
export const readOnlyDiff$ = Cell(false)

/** @internal */
export const sourceEditorView$ = Cell<{ view: EditorView; mode: 'source' | 'diff' } | null>(null)

/** @internal */
export const pendingSourceEditorState$ = Cell<EditorState | null>(null)

function getSourceEditorState(realm: Realm): EditorState {
  const doc = realm.getValue(markdownSourceEditorValue$)
  const outgoingState = realm.getValue(sourceEditorView$)?.view.state
  if (outgoingState?.doc.toString() === doc) return outgoingState
  const pendingState = realm.getValue(pendingSourceEditorState$)
  if (pendingState?.doc.toString() === doc) return pendingState
  return EditorState.create({ doc, extensions: [...realm.getValue(cmExtensions$), history()] })
}

/** @internal */
export function getSourceEditorConfig(realm: Realm): EditorStateConfig {
  const state = getSourceEditorState(realm)
  // React StrictMode can mount the view twice. Reading must not consume the
  // pending selection/history before the real mount receives it.
  return {
    doc: state.doc,
    selection: state.selection,
    extensions: historyField.init(() => state.field(historyField))
  }
}

/**
 * @group Diff/Source
 */
export const diffSourcePlugin = realmPlugin<{
  /**
   * The initial view mode of the editor.
   * @default 'rich-text'
   */
  viewMode?: ViewMode
  /**
   * The markdown to show in the diff editor.
   * @default ''
   */
  diffMarkdown?: string
  /**
   * Optional, additional CodeMirror extensions to load in the diff/source mode.
   */
  codeMirrorExtensions?: Extension[]
  /**
   * Set the diff editor to read-only.
   * @default false
   */
  readOnlyDiff?: boolean
}>({
  update: (r, params) => {
    r.pub(diffMarkdown$, params?.diffMarkdown ?? '')
  },

  init(r, params) {
    r.sub(viewMode$, (mode) => {
      r.pub(pendingSourceEditorState$, mode === 'rich-text' ? null : getSourceEditorState(r))
    })
    r.sub(markdownSourceEditorValue$, (markdown) => {
      const editor = r.getValue(sourceEditorView$)
      if (!editor || r.getValue(viewMode$) === 'rich-text') return
      if (editor.view.state.doc.toString() !== markdown) {
        editor.view.dispatch({
          changes: { from: 0, to: editor.view.state.doc.length, insert: markdown },
          selection: { anchor: 0 },
          filter: false
        })
      }
      r.pub(pendingSourceEditorState$, editor.view.state)
    })
    r.pub(insertMarkdownHandler$, (markdown) => {
      const mode = r.getValue(viewMode$)
      if (mode === 'rich-text') return false
      const editor = r.getValue(sourceEditorView$)
      if (editor) {
        // Until unmount, the outgoing view still owns the source document.
        // Use its dispatch pipeline so MergeView updates both sides' chunks.
        editor.view.dispatch(editor.view.state.replaceSelection(markdown))
        if (r.getValue(viewMode$) !== 'rich-text') r.pub(pendingSourceEditorState$, editor.view.state)
      } else {
        // A mode change can precede the corresponding React editor mount.
        // Apply the edit now, retaining its selection and history for that mount.
        const state = getSourceEditorState(r)
        const nextState = state.update(state.replaceSelection(markdown)).state
        r.pubIn({
          [pendingSourceEditorState$]: nextState,
          [markdownSourceEditorValue$]: nextState.doc.toString()
        })
      }
      return true
    })
    r.pubIn({
      [diffMarkdown$]: params?.diffMarkdown ?? '',
      [cmExtensions$]: params?.codeMirrorExtensions ?? [],
      [addEditorWrapper$]: DiffSourceWrapper,
      [readOnlyDiff$]: params?.readOnlyDiff ?? false,
      [viewMode$]: params?.viewMode ?? 'rich-text'
    })
  }
})
