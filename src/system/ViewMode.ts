import { $getRoot } from 'lexical'
import { system } from '../gurx'
import { importMarkdownToLexical } from '../import'
import { ViewMode } from '../ui'
import { getStateAsMarkdown } from '../utils/lexicalHelpers'
import { EditorSystemType } from './Editor'
import { JsxSystemType } from './Jsx'

export const [ViewModeSystem] = system(
  (r, [{ editor }, { jsxComponentDescriptors }]) => {
    const viewMode = r.node<ViewMode>('editor')
    const markdownSource = r.node('')
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
        r.o.withLatestFrom(editor, markdownSource, jsxComponentDescriptors)
      ),
      ([{ current }, editor, markdownValue, jsxComponentDescriptors]) => {
        // we're switching away from the editor, update the source.
        if (current === 'editor') {
          r.pub(markdownSource, getStateAsMarkdown(editor!, jsxComponentDescriptors))
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
      headMarkdown,
      markdownSource,
    }
  },
  [EditorSystemType, JsxSystemType]
)
