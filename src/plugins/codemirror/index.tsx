import { realmPlugin } from '../../RealmWithPlugins'
import { Cell, Signal, map } from '@mdxeditor/gurx'
import { CodeBlockEditorDescriptor, appendCodeBlockEditorDescriptor$, insertCodeBlock$ } from '../codeblock'
import { CodeMirrorEditor } from './CodeMirrorEditor'
import { Extension } from '@codemirror/state'
import { LanguageSupport } from '@codemirror/language'

/**
 * @internal
 */
export const EMPTY_VALUE = '__EMPTY_VALUE__'

/**
 * A code block language entry with a name and optional aliases/extensions.
 * Compatible with CodeMirror's `LanguageDescription` from `@codemirror/language-data`.
 * @group CodeMirror
 */
export interface CodeBlockLanguage {
  /** Display name shown in the language select dropdown. */
  name: string
  /** Alternative identifiers for this language (e.g. `["js"]` for JavaScript). */
  alias?: readonly string[]
  /** File extensions associated with this language (e.g. `["js", "mjs"]`). */
  extensions?: readonly string[]
  /** Pre-loaded language support. When provided, this is used directly instead of auto-loading. */
  support?: LanguageSupport
}

/**
 * Internal normalized representation of code block languages.
 * @group CodeMirror
 */
export interface NormalizedCodeBlockLanguages {
  /** Items for the language select dropdown. */
  items: { value: string; label: string }[]
  /** Maps any known key (canonical, alias, extension) to the canonical key. */
  keyMap: Record<string, string>
  /** Maps canonical keys to pre-loaded language support, when provided. */
  supportMap: Record<string, LanguageSupport>
}

/**
 * Normalizes the `codeBlockLanguages` parameter into a canonical form.
 * Accepts either a `Record<string, string>` (legacy) or a `CodeBlockLanguage[]` array.
 */
export function normalizeCodeBlockLanguages(input: Record<string, string> | CodeBlockLanguage[]): NormalizedCodeBlockLanguages {
  const items: { value: string; label: string }[] = []
  const keyMap: Record<string, string> = {}
  const supportMap: Record<string, LanguageSupport> = {}

  if (Array.isArray(input)) {
    for (const lang of input) {
      // The canonical key is the first alias, or the lowercased name
      const canonical = lang.alias?.[0] ?? lang.name.toLowerCase()
      items.push({ value: canonical, label: lang.name })
      keyMap[canonical] = canonical
      if (lang.alias) {
        for (const alias of lang.alias) {
          keyMap[alias] = canonical
        }
      }
      if (lang.extensions) {
        for (const ext of lang.extensions) {
          keyMap[ext] = canonical
        }
      }
      // Also map the lowercased name
      keyMap[lang.name.toLowerCase()] = canonical
      if (lang.support) {
        supportMap[canonical] = lang.support
      }
    }
  } else {
    const firstKeyByLabel: Record<string, string> = {}
    for (const [key, label] of Object.entries(input)) {
      if (!(label in firstKeyByLabel)) {
        firstKeyByLabel[label] = key
        items.push({ value: key || EMPTY_VALUE, label })
      }
      keyMap[key] = firstKeyByLabel[label] || EMPTY_VALUE
    }
  }

  return { items, keyMap, supportMap }
}

/**
 * The normalized code block languages used by the CodeMirror editor.
 * @group CodeMirror
 */
export const codeBlockLanguages$ = Cell<NormalizedCodeBlockLanguages>(
  normalizeCodeBlockLanguages({
    js: 'JavaScript',
    ts: 'TypeScript',
    tsx: 'TypeScript (React)',
    jsx: 'JavaScript (React)',
    css: 'CSS'
  })
)

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
 * A plugin that adds lets users edit code blocks with CodeMirror.
 * @group CodeMirror
 */
export const codeMirrorPlugin = realmPlugin<{
  /**
   * The code block languages to display in the language select dropdown.
   * Accepts either a `Record<string, string>` (key → label) for backwards compatibility,
   * or an array of {@link CodeBlockLanguage} objects (compatible with CodeMirror's `LanguageDescription`
   * from `@codemirror/language-data`), which supports aliases and file extensions.
   */
  codeBlockLanguages: Record<string, string> | CodeBlockLanguage[]
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
      [codeBlockLanguages$]: normalizeCodeBlockLanguages(params?.codeBlockLanguages ?? {}),
      [codeMirrorExtensions$]: params?.codeMirrorExtensions ?? [],
      [codeMirrorAutoLoadLanguageSupport$]: params?.autoLoadLanguageSupport ?? true
    })
  },

  init(r, params) {
    const normalized = normalizeCodeBlockLanguages(params?.codeBlockLanguages ?? {})
    r.pubIn({
      [codeBlockLanguages$]: normalized,
      [codeMirrorExtensions$]: params?.codeMirrorExtensions ?? [],
      [appendCodeBlockEditorDescriptor$]: buildCodeBlockDescriptor(normalized),
      [codeMirrorAutoLoadLanguageSupport$]: params?.autoLoadLanguageSupport ?? true
    })
  }
})

function buildCodeBlockDescriptor(normalized: NormalizedCodeBlockLanguages): CodeBlockEditorDescriptor {
  return {
    match(language, meta) {
      return Object.hasOwn(normalized.keyMap, language ?? '') && !meta
    },
    priority: 1,
    Editor: CodeMirrorEditor
  }
}
