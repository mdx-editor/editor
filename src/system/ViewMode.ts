import { system } from '../gurx'
import { $getRoot, LexicalEditor } from 'lexical'
import { ViewMode } from '../ui'
import { AvailableJsxImports, exportMarkdownFromLexical } from '../export'
import { tap } from '../utils/fp'
import { importMarkdownToLexical } from '../import'
import { EditorSystemType } from './Editor'

function getStateAsMarkdown(editor: LexicalEditor, availableImports?: AvailableJsxImports) {
  return tap({ markdown: '' }, (result) => {
    editor.getEditorState().read(() => {
      result.markdown = exportMarkdownFromLexical({ root: $getRoot(), availableImports: availableImports })
    })
  }).markdown
}

export const [ViewModeSystem] = system(
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
