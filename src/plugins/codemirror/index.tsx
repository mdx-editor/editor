import { realmPlugin } from '../../RealmWithPlugins'
import { Cell, Signal, map } from '@mdxeditor/gurx'
import { CodeBlockEditorDescriptor, appendCodeBlockEditorDescriptor$, insertCodeBlock$ } from '../codeblock'
import { CodeMirrorEditor } from './CodeMirrorEditor'
import { SandpackThemeProp } from '@codesandbox/sandpack-react/types'

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
 * The theme CodeMirrorEditor used.
 * It can be "light" | "dark" | "auto",
 * or the theme in "@codesandbox/sandpack-themes" package,
 * or you can also custom one,
 * learn more https://sandpack.codesandbox.io/docs/getting-started/themes#custom-theme
 */
export const codeMirrorTheme$ = Cell<SandpackThemeProp>('auto')

/**
 * A plugin that adds lets users edit code blocks with CodeMirror.
 * @group CodeMirror
 */
export const codeMirrorPlugin = realmPlugin<{
  codeBlockLanguages: Record<string, string>
  /**
   * The theme of CodeMirrorEditor
   */
  theme?: SandpackThemeProp
}>({
  update(r, params) {
    r.pubIn({
      [codeBlockLanguages$]: params?.codeBlockLanguages,
      [codeMirrorTheme$]: params?.theme || 'auto'
    })
  },

  init(r, params) {
    r.pubIn({
      [codeBlockLanguages$]: params?.codeBlockLanguages,
      [codeMirrorTheme$]: params?.theme || 'auto',
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
