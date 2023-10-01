import React from 'react'

import { diffSourcePluginHooks } from '.'
import { corePluginHooks } from '../core'

import { MergeView } from '@codemirror/merge'
import { EditorState } from '@codemirror/state'
import { EditorView } from '@codemirror/view'
import { COMMON_STATE_CONFIG_EXTENSIONS } from './SourceEditor'

export const DiffViewer: React.FC = () => {
  const [newText] = corePluginHooks.useEmitterValues('markdown')
  const [oldText] = diffSourcePluginHooks.useEmitterValues('diffMarkdown')
  const updateMarkdown = diffSourcePluginHooks.usePublisher('markdownSourceEditorValue')
  return <CmMergeView oldMarkdown={oldText} newMarkdown={newText} onUpdate={updateMarkdown} />
}

interface CmMergeViewProps {
  oldMarkdown: string
  newMarkdown: string
  onUpdate: (markdown: string) => void
}

const CmMergeView: React.FC<CmMergeViewProps> = ({ oldMarkdown, newMarkdown, onUpdate }) => {
  const cmMergeViewRef = React.useRef<MergeView | null>(null)

  const ref = React.useCallback(
    (el: HTMLDivElement | null) => {
      if (el !== null) {
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
            extensions: [...COMMON_STATE_CONFIG_EXTENSIONS, EditorState.readOnly.of(true)]
          },
          b: {
            doc: newMarkdown,
            extensions: [
              ...COMMON_STATE_CONFIG_EXTENSIONS,
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
    [newMarkdown, oldMarkdown, onUpdate]
  )

  return <div ref={ref} />
}
