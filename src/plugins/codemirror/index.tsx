import { realmPlugin } from '../../RealmWithPlugins'
import { Cell, Signal, map } from '@mdxeditor/gurx'
import { CodeBlockEditorDescriptor, appendCodeBlockEditorDescriptor$, insertCodeBlock$ } from '../codeblock'
import { CodeMirrorEditor } from './CodeMirrorEditor'

/**
 * The codemirror code block languages.
 * @group CodeMirror
 */
export const codeBlockLanguages$ = Cell({
  js: 'JavaScript',
  ts: 'TypeScript',
  tsx: 'TypeScript (React)',
  jsx: 'JavaScript (React)',
  css: 'CSS'
})

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
export const codeMirrorPlugin = realmPlugin<{ codeBlockLanguages: Record<string, string> }>({
  update(r, params) {
    r.pub(codeBlockLanguages$, params?.codeBlockLanguages)
  },

  init(r, params) {
    r.pubIn({
      [codeBlockLanguages$]: params?.codeBlockLanguages,
      [appendCodeBlockEditorDescriptor$]: buildCodeBlockDescriptor(params?.codeBlockLanguages || {})
    })
  }
})

function buildCodeBlockDescriptor(codeBlockLanguages: Record<string, string>): CodeBlockEditorDescriptor {
  return {
    match(language, meta) {
      return Boolean(codeBlockLanguages.hasOwnProperty(language || '')) && !Boolean(meta)
    },
    priority: 1,
    Editor: CodeMirrorEditor
  }
}
