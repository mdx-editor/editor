import React from 'react'

import { markdown$, markdownSourceEditorValue$, onBlur$, readOnly$ } from '../core'

import { MergeView } from '@codemirror/merge'
import { EditorState } from '@codemirror/state'
import { EditorView } from '@codemirror/view'
import { COMMON_STATE_CONFIG_EXTENSIONS } from './SourceEditor'
import { useCellValue, useCellValues, usePublisher, useRealm } from '@mdxeditor/gurx'
import { cmExtensions$, diffMarkdown$, readOnlyDiff$ } from './utils'

function setContent(view: EditorView | undefined, content: string) {
  if (view !== undefined) {
    view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: content } })
  }
}

export const DiffViewer: React.FC = () => {
  const realm = useRealm()
  const [newMarkdown, oldMarkdown, readOnly, readOnlyDiff] = useCellValues(markdown$, diffMarkdown$, readOnly$, readOnlyDiff$)
  const onUpdate = usePublisher(markdownSourceEditorValue$)
  const elRef = React.useRef<HTMLDivElement | null>(null)
  const cmMergeViewRef = React.useRef<MergeView | null>(null)
  const cmExtensions = useCellValue(cmExtensions$)
  const triggerOnBlur = usePublisher(onBlur$)

  React.useEffect(() => {
    return realm.sub(diffMarkdown$, (newDiffMarkdown) => {
      setContent(cmMergeViewRef.current?.a, newDiffMarkdown)
    })
  }, [realm])

  React.useEffect(() => {
    return realm.sub(markdown$, (newMarkdown) => {
      setContent(cmMergeViewRef.current?.b, newMarkdown)
    })
  }, [realm])

  React.useEffect(() => {
    const isReadOnly = readOnly || readOnlyDiff

    const revertParams = isReadOnly
      ? ({
          renderRevertControl: undefined,
          revertControls: undefined
        } as const)
      : ({
          renderRevertControl: () => {
            const el = document.createElement('button')
            el.classList.add('cm-merge-revert')
            el.appendChild(document.createTextNode('\u2B95'))
            return el
          },
          revertControls: 'a-to-b'
        } as const)

    cmMergeViewRef.current = new MergeView({
      ...revertParams,
      parent: elRef.current!,
      orientation: 'a-b',
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
          EditorState.readOnly.of(isReadOnly),
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
    return () => {
      cmMergeViewRef.current?.destroy()
      cmMergeViewRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onUpdate, cmExtensions])

  return <div ref={elRef} className="mdxeditor-diff-editor" />
}
