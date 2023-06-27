import { $getRoot } from 'lexical'
import { system } from '../gurx'
import { importMarkdownToLexical } from '../import'
import { ViewMode } from '../types/ViewMode'
import { getStateAsMarkdown } from '../utils/lexicalHelpers'
import { EditorSystemType } from './Editor'
import { JsxSystemType } from './Jsx'

export const [ViewModeSystem] = system(
  (r, [{ editor, markdownParseOptions, markdownSource }, {}]) => {
    const viewMode = r.node<ViewMode>('editor')
    const headMarkdown = r.node('')

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
        r.o.withLatestFrom(editor, markdownSource, markdownParseOptions)
      ),
      ([{ current }, editor, markdownSource, markdownParseOptions]) => {
        if (current === 'markdown') {
          // we're switching away from the markdown editor, convert the source back to lexical nodes.
          editor?.update(() => {
            $getRoot().clear()
            importMarkdownToLexical({
              root: $getRoot(),
              markdown: markdownSource,
              ...markdownParseOptions!,
            })
          })
        }
      }
    )

    return {
      viewMode,
      headMarkdown,
    }
  },
  [EditorSystemType, JsxSystemType]
)
