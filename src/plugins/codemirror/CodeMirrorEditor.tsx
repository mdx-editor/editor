import { useCellValues } from '@mdxeditor/gurx'
import React from 'react'
import styles from '../../styles/ui.module.css'
import { CodeBlockEditorProps } from '../codeblock'
import { useCodeBlockEditorContext } from '../codeblock/CodeBlockNode'
import { iconComponentFor$, readOnly$, useTranslation } from '../core'

import { languages } from '@codemirror/language-data'
import { EditorState, Extension } from '@codemirror/state'
import { EditorView, lineNumbers, keymap } from '@codemirror/view'
import { indentWithTab } from '@codemirror/commands'
import { basicLight } from 'cm6-theme-basic-light'
import { basicSetup } from 'codemirror'
import { $setSelection } from 'lexical'
import { codeBlockLanguages$, codeMirrorAutoLoadLanguageSupport$, codeMirrorExtensions$ } from '.'
import { Select } from '../toolbar/primitives/select'

export const COMMON_STATE_CONFIG_EXTENSIONS: Extension[] = []
const EMPTY_VALUE = '__EMPTY_VALUE__'

export const CodeMirrorEditor = ({ language, nodeKey, code, focusEmitter }: CodeBlockEditorProps) => {
  const t = useTranslation()
  const { parentEditor, lexicalNode } = useCodeBlockEditorContext()
  const [readOnly, codeMirrorExtensions, autoLoadLanguageSupport, iconComponentFor, codeBlockLanguages] = useCellValues(
    readOnly$,
    codeMirrorExtensions$,
    codeMirrorAutoLoadLanguageSupport$,
    iconComponentFor$,
    codeBlockLanguages$
  )

  const { setCode } = useCodeBlockEditorContext()
  const editorViewRef = React.useRef<EditorView | null>(null)
  const elRef = React.useRef<HTMLDivElement | null>(null)

  const setCodeRef = React.useRef(setCode)
  setCodeRef.current = setCode

  React.useEffect(() => {
    const el = elRef.current!
    void (async () => {
      const extensions = [
        ...codeMirrorExtensions,
        basicSetup,
        basicLight,
        lineNumbers(),
        keymap.of([indentWithTab]),
        EditorView.lineWrapping,
        EditorView.updateListener.of(({ state }) => {
          setCodeRef.current(state.doc.toString())
        }),
        EditorView.domEventHandlers({
          focus: () => {
            parentEditor.update(() => {
              $setSelection(null)
            })
          }
        })
      ]
      if (readOnly) {
        extensions.push(EditorState.readOnly.of(true))
      }
      if (language !== '' && autoLoadLanguageSupport) {
        const languageData = languages.find((l) => {
          return l.name === language || l.alias.includes(language) || l.extensions.includes(language)
        })
        if (languageData) {
          try {
            const languageSupport = await languageData.load()
            extensions.push(languageSupport.extension)
          } catch (_e) {
            console.warn('failed to load language support for', language)
          }
        }
      }
      el.innerHTML = ''
      editorViewRef.current = new EditorView({
        parent: el,
        state: EditorState.create({ doc: code, extensions })
      })

      el.addEventListener('keydown', stopPropagationHandler)
    })()
    return () => {
      editorViewRef.current?.destroy()
      editorViewRef.current = null
      el.removeEventListener('keydown', stopPropagationHandler)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readOnly, language, ...codeMirrorExtensions])

  return (
    <div className={styles.codeMirrorWrapper}>
      <div className={styles.codeMirrorToolbar}>
        <Select
          disabled={readOnly}
          value={language}
          onChange={(language) => {
            parentEditor.update(() => {
              lexicalNode.setLanguage(language === EMPTY_VALUE ? '' : language)
              setTimeout(() => {
                parentEditor.update(() => {
                  lexicalNode.getLatest().select()
                })
              })
            })
          }}
          triggerTitle={t('codeBlock.selectLanguage', 'Select code block language')}
          placeholder={t('codeBlock.inlineLanguage', 'Language')}
          items={Object.entries(codeBlockLanguages).map(([value, label]) => ({ value: value ? value : EMPTY_VALUE, label }))}
        />
        <button
          className={styles.iconButton}
          type="button"
          disabled={readOnly}
          title={t('codeblock.delete', 'Delete code block')}
          onClick={(e) => {
            e.preventDefault()
            parentEditor.update(() => {
              lexicalNode.remove()
            })
          }}
        >
          {iconComponentFor('delete_small')}
        </button>
      </div>
      <div ref={elRef} />
    </div>
  )
}
function stopPropagationHandler(this: HTMLDivElement, ev: KeyboardEvent) {
  ev.stopPropagation()
}
