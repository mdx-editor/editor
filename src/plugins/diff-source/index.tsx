import { EditorState, Extension, type EditorStateConfig } from '@codemirror/state'
import { history, historyField } from '@codemirror/commands'
import { EditorView } from '@codemirror/view'
import { ViewMode, addEditorWrapper$, insertMarkdownHandler$, markdownSourceEditorValue$, readOnly$, viewMode$ } from '../core'
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

/** @internal */
export function getSourceEditorConfig(realm: Realm): EditorStateConfig {
  const doc = realm.getValue(markdownSourceEditorValue$)
  const pendingState = realm.getValue(pendingSourceEditorState$)
  realm.pub(pendingSourceEditorState$, null)
  if (pendingState?.doc.toString() === doc) {
    return {
      doc,
      selection: pendingState.selection,
      extensions: historyField.init(() => pendingState.field(historyField))
    }
  }
  return { doc }
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
      if (mode === 'rich-text') r.pub(pendingSourceEditorState$, null)
    })
    r.pub(insertMarkdownHandler$, (markdown) => {
      const mode = r.getValue(viewMode$)
      if (mode === 'rich-text') return false
      const editor = r.getValue(sourceEditorView$)
      if (editor?.mode === mode) {
        editor.view.dispatch(editor.view.state.replaceSelection(markdown))
      } else {
        // A mode change can precede the corresponding React editor mount.
        // Apply the edit now, retaining its selection and history for that mount.
        const doc = r.getValue(markdownSourceEditorValue$)
        const pendingState = r.getValue(pendingSourceEditorState$)
        const state =
          pendingState?.doc.toString() === doc
            ? pendingState
            : EditorState.create({
                doc,
                extensions: [
                  ...r.getValue(cmExtensions$),
                  history(),
                  EditorState.readOnly.of(r.getValue(readOnly$) || (mode === 'diff' && r.getValue(readOnlyDiff$)))
                ]
              })
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
