import { Extension } from '@codemirror/state'
import { realmPlugin, system } from '../../gurx'
import { coreSystem } from '../core'
import { DiffSourceWrapper } from './DiffSourceWrapper'

/** @internal */
export type ViewMode = 'rich-text' | 'source' | 'diff'

/** @internal */
export const diffSourceSystem = system(
  (r, [{ markdown, setMarkdown, markdownSignal }]) => {
    const diffMarkdown = r.node('')
    const markdownSourceEditorValue = r.node('')
    const cmExtensions = r.node<Extension[]>([])

    r.link(markdown, markdownSourceEditorValue)
    r.link(markdownSourceEditorValue, markdownSignal)
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
    return { viewMode, diffMarkdown, markdownSourceEditorValue, cmExtensions }
  },
  [coreSystem]
)

export interface DiffSourcePluginParams {
  viewMode?: ViewMode
  diffMarkdown?: string
  codeMirrorExtensions?: Extension[]
}

export const [
  /** @internal */
  diffSourcePlugin,
  /** @internal */
  diffSourcePluginHooks
] = realmPlugin({
  id: 'diff-source',
  systemSpec: diffSourceSystem,

  init(r, params?: DiffSourcePluginParams) {
    r.pubKey('diffMarkdown', params?.diffMarkdown || '')
    r.pubKey('cmExtensions', params?.codeMirrorExtensions || [])
    r.pubKey('addEditorWrapper', DiffSourceWrapper)
    r.pubKey('viewMode', params?.viewMode || 'rich-text')
  }
})
