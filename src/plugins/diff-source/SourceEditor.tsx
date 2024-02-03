import { markdown as markdownLanguageSupport } from '@codemirror/lang-markdown'
import { EditorState, Extension } from '@codemirror/state'
import { EditorView, lineNumbers } from '@codemirror/view'
import { basicLight } from 'cm6-theme-basic-light'
import { basicSetup } from 'codemirror'
import React from 'react'
import { cmExtensions$ } from '.'
import { markdown$, markdownSourceEditorValue$, onBlur$, readOnly$ } from '../core'
import { useCellValues, usePublisher } from '@mdxeditor/gurx'

export const COMMON_STATE_CONFIG_EXTENSIONS: Extension[] = [
  basicSetup,
  basicLight,
  markdownLanguageSupport(),
  lineNumbers(),
  EditorView.lineWrapping
]

export const SourceEditor = () => {
  const [markdown, readOnly, cmExtensions] = useCellValues(markdown$, readOnly$, cmExtensions$)
  const updateMarkdown = usePublisher(markdownSourceEditorValue$)
  const triggerOnBlur = usePublisher(onBlur$)
  const editorViewRef = React.useRef<EditorView | null>(null)

  const ref = React.useCallback(
    (el: HTMLDivElement | null) => {
      if (el !== null) {
        const extensions = [
          // custom extensions should come first so that you can override the default extensions
          ...cmExtensions,
          ...COMMON_STATE_CONFIG_EXTENSIONS,
          EditorView.updateListener.of(({ state }) => {
            updateMarkdown(state.doc.toString())
          }),
          EditorView.focusChangeEffect.of((_, focused) => {
            if (!focused) {
              triggerOnBlur(new FocusEvent('blur'))
            }
            return null
          })
        ]
        if (readOnly) {
          extensions.push(EditorState.readOnly.of(true))
        }
        el.innerHTML = ''
        editorViewRef.current = new EditorView({
          parent: el,
          state: EditorState.create({ doc: markdown, extensions })
        })
      } else {
        editorViewRef.current?.destroy()
        editorViewRef.current = null
      }
    },
    [markdown, readOnly, updateMarkdown, cmExtensions, triggerOnBlur]
  )

  return <div ref={ref} className="cm-sourceView mdxeditor-source-editor" />
}
