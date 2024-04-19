import React from 'react'
import styles from '../../styles/ui.module.css'
import { CodeBlockEditorProps } from '../codeblock'
import { useCodeBlockEditorContext } from '../codeblock/CodeBlockNode'
import { readOnly$ } from '../core'
import { useCellValues } from '@mdxeditor/gurx'

import { EditorState, Extension } from '@codemirror/state'
import { EditorView, lineNumbers } from '@codemirror/view'
import { basicLight } from 'cm6-theme-basic-light'
import { basicSetup } from 'codemirror'
import { languages } from '@codemirror/language-data'
import { useCodeMirrorRef } from '../sandpack/useCodeMirrorRef'
import { codeMirrorExtensions$ } from '.'

export const COMMON_STATE_CONFIG_EXTENSIONS: Extension[] = []

export const CodeMirrorEditor = ({ language, nodeKey, code, focusEmitter }: CodeBlockEditorProps) => {
  const [readOnly, codeMirrorExtensions] = useCellValues(readOnly$, codeMirrorExtensions$)

  const codeMirrorRef = useCodeMirrorRef(nodeKey, 'codeblock', language, focusEmitter)
  const { setCode } = useCodeBlockEditorContext()
  const editorViewRef = React.useRef<EditorView | null>(null)
  const elRef = React.useRef<HTMLDivElement | null>(null)

  const setCodeRef = React.useRef(setCode)
  setCodeRef.current = setCode
  codeMirrorRef.current = {
    getCodemirror: () => editorViewRef.current!
  }

  React.useEffect(() => {
    void (async () => {
      const extensions = [
        ...codeMirrorExtensions,
        basicSetup,
        basicLight,
        lineNumbers(),
        EditorView.lineWrapping,
        EditorView.updateListener.of(({ state }) => {
          setCodeRef.current(state.doc.toString())
        })
      ]
      if (readOnly) {
        extensions.push(EditorState.readOnly.of(true))
      }
      if (language !== '') {
        const languageData = languages.find((l) => {
          return l.name === language || l.alias.includes(language) || l.extensions.includes(language)
        })
        if (languageData) {
          try {
            const languageSupport = await languageData.load()
            extensions.push(languageSupport.extension)
          } catch (e) {
            console.warn('failed to load language support for', language)
          }
        }
      }
      elRef.current!.innerHTML = ''
      editorViewRef.current = new EditorView({
        parent: elRef.current!,
        state: EditorState.create({ doc: code, extensions })
      })
    })()
    return () => {
      editorViewRef.current?.destroy()
      editorViewRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readOnly, language])

  return (
    <div
      className={styles.codeMirrorWrapper}
      onKeyDown={(e) => {
        e.stopPropagation()
      }}
    >
      <div ref={elRef} />
    </div>
  )
}
