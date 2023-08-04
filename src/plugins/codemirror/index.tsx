import { realmPlugin, system } from '../../gurx'
import { coreSystem } from '../core'
import { codeBlockSystem } from '../codeblock'
import { CodeMirrorEditor } from './CodeMirrorEditor'

const defaultCodeBlockLanguages: Record<string, string> = {
  js: 'JavaScript',
  ts: 'TypeScript',
  tsx: 'TypeScript (React)',
  jsx: 'JavaScript (React)',
  css: 'CSS'
}

/** @internal */
export const codeMirrorSystem = system(
  (r, [, { insertCodeBlock }]) => {
    const codeBlockLanguages = r.node(defaultCodeBlockLanguages)
    const insertCodeMirror = r.node<{ language: string; code: string }>()

    r.link(
      r.pipe(
        insertCodeMirror,
        r.o.map(({ language, code }) => {
          return {
            code: code,
            language,
            meta: ''
          }
        })
      ),
      insertCodeBlock
    )

    return {
      codeBlockLanguages,
      insertCodeMirror
    }
  },
  [coreSystem, codeBlockSystem]
)

export const [
  /** @internal */
  codeMirrorPlugin,
  /** @internal */
  codeMirrorHooks
] = realmPlugin({
  id: 'codemirror',
  systemSpec: codeMirrorSystem,
  applyParamsToSystem(r, params: { codeBlockLanguages: Record<string, string> }) {
    r.pubKey('codeBlockLanguages', params.codeBlockLanguages)
  },

  init(r, { codeBlockLanguages }) {
    r.pubKey('appendCodeBlockEditorDescriptor', {
      match(language, meta) {
        return codeBlockLanguages.hasOwnProperty(language) && meta === ''
      },
      priority: 1,
      Editor: CodeMirrorEditor
    })
  }
})
