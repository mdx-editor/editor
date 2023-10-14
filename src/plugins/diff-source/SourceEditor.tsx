import { markdown as markdownLanguageSupport } from '@codemirror/lang-markdown'
import { EditorState, Extension } from '@codemirror/state'
import { EditorView, lineNumbers } from '@codemirror/view'
import { basicLight } from 'cm6-theme-basic-light'
import { basicDark } from 'cm6-theme-basic-dark'
import { basicSetup } from 'codemirror'
import React from 'react'
import { diffSourcePluginHooks } from '.'
import { corePluginHooks } from '../core'

export const COMMON_STATE_CONFIG_EXTENSIONS: Extension[] = [basicSetup, markdownLanguageSupport(), lineNumbers()]

export const SourceEditor = () => {
  const [markdown, readOnly, className] = corePluginHooks.useEmitterValues('markdown', 'readOnly', 'className')
  const updateMarkdown = diffSourcePluginHooks.usePublisher('markdownSourceEditorValue')
  const editorViewRef = React.useRef<EditorView | null>(null)

  const ref = React.useCallback(
    (el: HTMLDivElement | null) => {
      if (el !== null) {
        const extensions = [
          ...COMMON_STATE_CONFIG_EXTENSIONS,
          EditorView.updateListener.of(({ state }) => {
            updateMarkdown(state.doc.toString())
          })
        ]
        if (className && className.indexOf('dark-theme') > -1) {
          extensions.push(basicDark)
        } else {
          extensions.push(basicLight)
        }
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
    [className, markdown, readOnly, updateMarkdown]
  )

  return <div ref={ref} className="cm-sourceView" />
}
