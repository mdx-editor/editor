import { Extension } from '@codemirror/state'
import { ViewMode, addEditorWrapper$, viewMode$ } from '../core'
import { DiffSourceWrapper } from './DiffSourceWrapper'
import { Cell } from '@mdxeditor/gurx'
import { realmPlugin } from '../../RealmWithPlugins'

/** @internal */
export const diffMarkdown$ = Cell('')

/** @internal */
export const cmExtensions$ = Cell<Extension[]>([])

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
}>({
  update: (r, params) => {
    r.pub(diffMarkdown$, params?.diffMarkdown || '')
  },

  init(r, params) {
    r.pubIn({
      [diffMarkdown$]: params?.diffMarkdown || '',
      [cmExtensions$]: params?.codeMirrorExtensions || [],
      [addEditorWrapper$]: DiffSourceWrapper,
      [viewMode$]: params?.viewMode || 'rich-text'
    })
  }
})
