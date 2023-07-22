import 'mdast-util-directive'
import { system } from '../gurx'
import { ViewMode } from '../types/ViewMode'
import { EditorSystemType } from './Editor'
import { JsxSystemType } from './Jsx'

export const [ViewModeSystem] = system(
  (r, [{ markdownSource, setMarkdown }, {}]) => {
    const viewMode = r.node<ViewMode>('editor')
    const headMarkdown = r.node('')
    const markdownSourceFromEditor = r.node('')

    r.link(markdownSource, markdownSourceFromEditor)

    r.sub(
      r.pipe(
        viewMode,
        r.o.scan(
          (prev, next) => {
            return {
              current: prev.next,
              next
            }
          },
          { current: 'editor' as ViewMode, next: 'editor' as ViewMode }
        ),
        r.o.withLatestFrom(markdownSourceFromEditor)
      ),
      ([{ current }, markdownSourceFromEditor]) => {
        if (current === 'markdown') {
          r.pub(setMarkdown, markdownSourceFromEditor)
        }
      }
    )

    return {
      viewMode,
      markdownSourceFromEditor,
      headMarkdown
    }
  },
  [EditorSystemType, JsxSystemType]
)
