import { markdown as markdownLanguageSupport } from '@codemirror/lang-markdown'
import { EditorState, Extension } from '@codemirror/state'
import { EditorView, lineNumbers } from '@codemirror/view'
import { basicLight } from 'cm6-theme-basic-light'
import { basicSetup } from 'codemirror'
import React from 'react'
import { diffSourcePluginHooks } from '.'
import { corePluginHooks } from '../core'

export const COMMON_STATE_CONFIG_EXTENSIONS: Extension[] = [basicSetup, basicLight, markdownLanguageSupport(), lineNumbers()]

export const SourceEditor = () => {
  const [markdown, readOnly] = corePluginHooks.useEmitterValues('markdown', 'readOnly')
  const [cmExtensions] = diffSourcePluginHooks.useEmitterValues('cmExtensions')
  const updateMarkdown = diffSourcePluginHooks.usePublisher('markdownSourceEditorValue')
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
    [markdown, readOnly, updateMarkdown, cmExtensions]
  )

  return <div ref={ref} className="cm-sourceView" />
}
