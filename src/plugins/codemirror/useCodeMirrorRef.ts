import { EditorView } from '@codemirror/view'
import { $createParagraphNode, $getNodeByKey } from 'lexical'
import React from 'react'
import { VoidEmitter } from '../../utils/voidEmitter'
import { useCodeBlockEditorContext } from '../codeblock/CodeBlockNode'
import { activeEditor$, editorInFocus$ } from '../core'
import { useCellValue, usePublisher } from '@mdxeditor/gurx'

export interface CodeMirrorRef {
  getCodemirror(): EditorView | null
}

export function useCodeMirrorRef(nodeKey: string, language: string, focusEmitter: VoidEmitter) {
  const activeEditor = useCellValue(activeEditor$)
  const setEditorInFocus = usePublisher(editorInFocus$)
  const codeMirrorRef = React.useRef<CodeMirrorRef | null>(null)
  const { lexicalNode } = useCodeBlockEditorContext()

  // These flags allow the user to escape the editor with arrows. They are set
  // when the cursor is at the top or bottom and cleared after the second arrow.
  const atBottom = React.useRef(false)
  const atTop = React.useRef(false)

  const onFocusHandler = React.useCallback(() => {
    setEditorInFocus({
      editorType: 'codeblock',
      rootNode: lexicalNode,
      editorRef: codeMirrorRef.current
    })
  }, [lexicalNode, setEditorInFocus])

  const onKeyDownHandler = React.useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        const state = codeMirrorRef.current?.getCodemirror()?.state
        if (state) {
          const docLength = state.doc.length
          const selectionEnd = state.selection.ranges[0].to

          if (docLength === selectionEnd) {
            if (!atBottom.current) {
              atBottom.current = true
            } else {
              activeEditor?.update(() => {
                const node = $getNodeByKey(nodeKey)!
                const nextSibling = node.getNextSibling()
                if (nextSibling) {
                  codeMirrorRef.current?.getCodemirror()?.contentDOM.blur()
                  node.selectNext()
                } else {
                  node.insertAfter($createParagraphNode())
                }
              })
              atBottom.current = false
            }
          }
        }
      } else if (e.key === 'ArrowUp') {
        const state = codeMirrorRef.current?.getCodemirror()?.state
        if (state) {
          const selectionStart = state.selection.ranges[0].from

          if (selectionStart === 0) {
            if (!atTop.current) {
              atTop.current = true
            } else {
              activeEditor?.update(() => {
                const node = $getNodeByKey(nodeKey)!
                const previousSibling = node.getPreviousSibling()
                if (previousSibling) {
                  codeMirrorRef.current?.getCodemirror()?.contentDOM.blur()
                  node.selectPrevious()
                }
              })
              atTop.current = false
            }
          }
        }
      } else if (e.key === 'Enter') {
        e.stopPropagation()
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        const state = codeMirrorRef.current?.getCodemirror()?.state
        const docLength = state?.doc.length
        if (docLength === 0) {
          activeEditor?.update(() => {
            const node = $getNodeByKey(nodeKey)!
            node.remove()
          })
        }
      }
    },
    [activeEditor, nodeKey]
  )

  React.useEffect(() => {
    const codeMirror = codeMirrorRef.current
    setTimeout(() => {
      codeMirror?.getCodemirror()?.contentDOM.addEventListener('focus', onFocusHandler)
      codeMirror?.getCodemirror()?.contentDOM.addEventListener('keydown', onKeyDownHandler)
    }, 300)

    return () => {
      codeMirror?.getCodemirror()?.contentDOM.removeEventListener('focus', onFocusHandler)
      codeMirror?.getCodemirror()?.contentDOM.removeEventListener('keydown', onKeyDownHandler)
    }
  }, [codeMirrorRef, onFocusHandler, onKeyDownHandler, language])

  React.useEffect(() => {
    focusEmitter.subscribe(() => {
      codeMirrorRef.current?.getCodemirror()?.focus()
      onFocusHandler()
    })
  }, [focusEmitter, codeMirrorRef, nodeKey, onFocusHandler])

  return codeMirrorRef
}
