import { Extension } from '@codemirror/state'
import { realmPlugin, system } from '../../gurx'
import { coreSystem } from '../core'
import { DiffSourceWrapper } from './DiffSourceWrapper'

/** @internal */
export type ViewMode = 'rich-text' | 'source' | 'diff'

/** @internal */
export const diffSourceSystem = system(
  (r, [{ markdown, setMarkdown }]) => {
    const diffMarkdown = r.node('')
    const theme = r.node<Extension | null>(null)
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
          r.pub(setMarkdown, markdownSourceFromEditor)
        }
      }
    )
    return { viewMode, diffMarkdown, markdownSourceEditorValue, theme }
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

  applyParamsToSystem(realm, params?: { viewMode?: ViewMode; diffMarkdown?: string; theme?: Extension }) {
    realm.pubKeys({
      viewMode: params?.viewMode,
      theme: params?.theme
    })
  },
  init(r, params) {
    r.pubKey('diffMarkdown', params?.diffMarkdown || '')
    r.pubKey('addEditorWrapper', DiffSourceWrapper)
  }
})
