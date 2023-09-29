import { realmPlugin, system } from '../../gurx'
import { coreSystem } from '../core'
import { DiffSourceWrapper } from './DiffSourceWrapper'

/** @internal */
export type ViewMode = 'rich-text' | 'source' | 'diff'

/** @internal */
export const diffSourceSystem = system(
  (r, [{ markdown, setMarkdown }]) => {
    const diffMarkdown = r.node('')
    const markdownSourceEditorValue = r.node('')

    r.link(markdown, markdownSourceEditorValue)
    const viewMode = r.node<ViewMode>('rich-text')

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
          { current: 'rich-text' as ViewMode, next: 'rich-text' as ViewMode }
        ),
        r.o.withLatestFrom(markdownSourceEditorValue)
      ),
      ([{ current }, markdownSourceFromEditor]) => {
        if (current === 'source' || current === 'diff') {
          console.log('setting markdown', markdownSourceFromEditor)
          r.pub(setMarkdown, markdownSourceFromEditor)
        }
      }
    )
    return { viewMode, diffMarkdown, markdownSourceEditorValue }
  },
  [coreSystem]
)

export const [
  /** @internal */
  diffSourcePlugin,
  /** @internal */
  diffSourcePluginHooks
] = realmPlugin({
  id: 'diff-source',
  systemSpec: diffSourceSystem,

  applyParamsToSystem(r, params?: { viewMode?: ViewMode; diffMarkdown?: string }) {
    r.pubKey('viewMode', params?.viewMode || 'rich-text')
  },
  init(r, params) {
    r.pubKey('diffMarkdown', params?.diffMarkdown || '')
    r.pubKey('addEditorWrapper', DiffSourceWrapper)
  }
})
