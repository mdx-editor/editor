import React from 'react'

import { diffSourcePluginHooks } from '.'
import { corePluginHooks } from '../core'

import { MergeView } from '@codemirror/merge'
import { EditorState, Extension } from '@codemirror/state'
import { EditorView } from '@codemirror/view'
import { COMMON_STATE_CONFIG_EXTENSIONS } from './SourceEditor'

export const DiffViewer: React.FC = () => {
  const [newText] = corePluginHooks.useEmitterValues('markdown')
  const [oldText, theme] = diffSourcePluginHooks.useEmitterValues('diffMarkdown', 'theme')
  const updateMarkdown = diffSourcePluginHooks.usePublisher('markdownSourceEditorValue')
  return <CmMergeView theme={theme} oldMarkdown={oldText} newMarkdown={newText} onUpdate={updateMarkdown} />
}

interface CmMergeViewProps {
  oldMarkdown: string
  newMarkdown: string
  theme: Extension | null
  onUpdate: (markdown: string) => void
}

const CmMergeView: React.FC<CmMergeViewProps> = ({ oldMarkdown, newMarkdown, theme, onUpdate }) => {
  const cmMergeViewRef = React.useRef<MergeView | null>(null)

  const ref = React.useCallback(
    (el: HTMLDivElement | null) => {
      if (el !== null) {
        const extensions = [...COMMON_STATE_CONFIG_EXTENSIONS]

        if (theme) {
          extensions.push(theme)
        }

        cmMergeViewRef.current = new MergeView({
          renderRevertControl: () => {
            const el = document.createElement('button')
            el.classList.add('cm-merge-revert')
            el.appendChild(document.createTextNode('\u2B95'))
            return el
          },
          parent: el,
          orientation: 'a-b',
          revertControls: 'a-to-b',
          gutter: true,
          a: {
            doc: oldMarkdown,
            extensions: [...extensions, EditorState.readOnly.of(true)]
          },
          b: {
            doc: newMarkdown,
            extensions: [
              ...extensions,
              EditorView.updateListener.of(({ state }) => {
                const md = state.doc.toString()
                onUpdate(md)
              })
            ]
          }
        })
      } else {
        cmMergeViewRef.current?.destroy()
        cmMergeViewRef.current = null
      }
    },
    [newMarkdown, oldMarkdown, onUpdate, theme]
  )

  return <div ref={ref} />
}
