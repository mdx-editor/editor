import React from 'react'

import { cmExtensions$, diffMarkdown$ } from '.'
import { markdown$, markdownSourceEditorValue$, onBlur$ } from '../core'

import { MergeView } from '@codemirror/merge'
import { EditorState } from '@codemirror/state'
import { EditorView } from '@codemirror/view'
import { COMMON_STATE_CONFIG_EXTENSIONS } from './SourceEditor'
import { useCellValue, useCellValues, usePublisher } from '@mdxeditor/gurx'

export const DiffViewer: React.FC = () => {
  const [newText, oldText] = useCellValues(markdown$, diffMarkdown$)
  const updateMarkdown = usePublisher(markdownSourceEditorValue$)
  return <CmMergeView oldMarkdown={oldText} newMarkdown={newText} onUpdate={updateMarkdown} />
}

interface CmMergeViewProps {
  oldMarkdown: string
  newMarkdown: string
  onUpdate: (markdown: string) => void
}

const CmMergeView: React.FC<CmMergeViewProps> = ({ oldMarkdown, newMarkdown, onUpdate }) => {
  const cmMergeViewRef = React.useRef<MergeView | null>(null)
  const cmExtensions = useCellValue(cmExtensions$)
  const triggerOnBlur = usePublisher(onBlur$)

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
            extensions: [...cmExtensions, ...COMMON_STATE_CONFIG_EXTENSIONS, EditorState.readOnly.of(true)]
          },
          b: {
            doc: newMarkdown,
            extensions: [
              ...cmExtensions,
              ...COMMON_STATE_CONFIG_EXTENSIONS,
              EditorView.updateListener.of(({ state }) => {
                const md = state.doc.toString()
                onUpdate(md)
              }),
              EditorView.focusChangeEffect.of((_, focused) => {
                if (!focused) {
                  triggerOnBlur(new FocusEvent('blur'))
                }
                return null
              })
            ]
          }
        })
      } else {
        cmMergeViewRef.current?.destroy()
        cmMergeViewRef.current = null
      }
    },
    [newMarkdown, oldMarkdown, onUpdate, cmExtensions, triggerOnBlur]
  )

  return <div ref={ref} />
}
