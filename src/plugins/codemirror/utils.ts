import { Extension } from '@codemirror/state'
import { Cell } from '@mdxeditor/gurx'

/**
 * The code mirror extensions for the coemirror code block editor.
 * @group CodeMirror
 */
export const codeMirrorExtensions$ = Cell<Extension[]>([])

/**
 * Whether or not to try to dynamically load the code block language support.
 * Disable if you want to manually pass the supported languages.
 * @group CodeMirror
 */
export const codeMirrorAutoLoadLanguageSupport$ = Cell<boolean>(true)

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
