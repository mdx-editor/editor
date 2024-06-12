import { realmPlugin } from '../../RealmWithPlugins'
import { Signal, map } from '@mdxeditor/gurx'
import { appendCodeBlockEditorDescriptor$, insertCodeBlock$ } from '../codeblock'
import { CodeMirrorEditor } from './CodeMirrorEditor'
import { Extension } from '@codemirror/state'
import { CodeBlockEditorDescriptor } from '../codeblock/utils'
import { codeBlockLanguages$, codeMirrorAutoLoadLanguageSupport$, codeMirrorExtensions$ } from './utils'

/**
 * Inserts a new code mirror code block with the specified parameters.
 * @group CodeMirror
 */
export const insertCodeMirror$ = Signal<{ language: string; code: string }>((r) => {
  r.link(
    r.pipe(
      insertCodeMirror$,
      map(({ language, code }) => {
        return {
          code: code,
          language,
          meta: ''
        }
      })
    ),
    insertCodeBlock$
  )
})

/**
 * A plugin that adds lets users edit code blocks with CodeMirror.
 * @group CodeMirror
 */
export const codeMirrorPlugin = realmPlugin<{
  codeBlockLanguages: Record<string, string>
  /**
   * Optional, additional CodeMirror extensions to load in the diff/source mode.
   */
  codeMirrorExtensions?: Extension[]
  /**
   * Whether or not to try to dynamically load the code block language support.
   * Disable if you want to manually pass the supported languages.
   * @group CodeMirror
   */
  autoLoadLanguageSupport?: boolean
}>({
  update(r, params) {
    r.pubIn({
      [codeBlockLanguages$]: params?.codeBlockLanguages,
      [codeMirrorExtensions$]: params?.codeMirrorExtensions ?? [],
      [codeMirrorAutoLoadLanguageSupport$]: params?.autoLoadLanguageSupport ?? true
    })
  },

  init(r, params) {
    r.pubIn({
      [codeBlockLanguages$]: params?.codeBlockLanguages,
      [codeMirrorExtensions$]: params?.codeMirrorExtensions ?? [],
      [appendCodeBlockEditorDescriptor$]: buildCodeBlockDescriptor(params?.codeBlockLanguages ?? {}),
      [codeMirrorAutoLoadLanguageSupport$]: params?.autoLoadLanguageSupport ?? true
    })
  }
})

function buildCodeBlockDescriptor(codeBlockLanguages: Record<string, string>): CodeBlockEditorDescriptor {
  return {
    match(language, meta) {
      return Boolean(Object.hasOwn(codeBlockLanguages, language ?? '')) && !meta
    },
    priority: 1,
    Editor: CodeMirrorEditor
  }
}
