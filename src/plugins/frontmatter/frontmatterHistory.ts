import { getPeerDependencyFromEditor } from '@lexical/extension'
import { HistoryExtension } from '@lexical/history'
import { LexicalEditor } from 'lexical'

// Opening a dialog need not focus the editable root. Preserve its initial state
// even when the first document edit comes from a dialog rather than typing.
export function ensureFrontmatterHistoryBaseline(editor: LexicalEditor) {
  const output = getPeerDependencyFromEditor<typeof HistoryExtension>(editor, HistoryExtension.name)?.output
  if (!output || output.disabled.value) return
  const history = output.historyState.value
  if (history.current?.editor !== editor) {
    if (history.current) history.undoStack.push(history.current)
    history.current = { editor, editorState: editor.getEditorState() }
  }
}
