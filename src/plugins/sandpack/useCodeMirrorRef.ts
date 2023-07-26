import { CodeMirrorRef } from '@codesandbox/sandpack-react/dist/components/CodeEditor/CodeMirror'
import { $createParagraphNode, $getNodeByKey } from 'lexical'
import React from 'react'
import { corePluginHooks } from '../core/realmPlugin'

export function useCodeMirrorRef(nodeKey: string, editorType: 'codeblock' | 'sandpack', language: string) {
  const [theEditor] = corePluginHooks.useEmitterValues('rootEditor')
  // const setActiveEditorType = usePublisher('activeEditorType')
  const codeMirrorRef = React.useRef<CodeMirrorRef>(null)

  // these flags escape the editor with arrows.
  // they are set to true when the cursor is at the top or bottom of the editor, and then the user presses the arrow.
  const atBottom = React.useRef(false)
  const atTop = React.useRef(false)

  const onFocusHandler = React.useCallback(() => {
    // setActiveEditorType({ type: editorType, nodeKey })
  }, [])

  const onKeyDownHandler = React.useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        const state = codeMirrorRef?.current?.getCodemirror()?.state
        if (state) {
          const docLength = state.doc.length
          const selectionEnd = state.selection.ranges[0].to

          if (docLength === selectionEnd) {
            // escaping once
            if (!atBottom.current) {
              atBottom.current = true
            } else {
              // escaping twice
              theEditor?.update(() => {
                const node = $getNodeByKey(nodeKey)!
                const nextSibling = node.getNextSibling()
                if (nextSibling) {
                  codeMirrorRef?.current?.getCodemirror()?.contentDOM.blur()
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
        const state = codeMirrorRef?.current?.getCodemirror()?.state
        if (state) {
          const selectionStart = state.selection.ranges[0].from

          if (selectionStart === 0) {
            // escaping once
            if (!atTop.current) {
              atTop.current = true
            } else {
              // escaping twice
              theEditor?.update(() => {
                const node = $getNodeByKey(nodeKey)!
                const previousSibling = node.getPreviousSibling()
                if (previousSibling) {
                  codeMirrorRef?.current?.getCodemirror()?.contentDOM.blur()
                  node.selectPrevious()
                } else {
                  // TODO: insert a paragraph before the sandpack node
                }
              })
              atTop.current = false
            }
          }
        }
      } else if (e.key === 'Enter') {
        e.stopPropagation()
      }
    },
    [theEditor, nodeKey]
  )

  React.useEffect(() => {
    const codeMirror = codeMirrorRef.current

    // TODO: This is a hack to get around the fact that the CodeMirror instance
    // is not available immediately after the component is mounted.
    setTimeout(() => {
      codeMirror?.getCodemirror()?.contentDOM?.addEventListener('focus', onFocusHandler)
      codeMirror?.getCodemirror()?.contentDOM?.addEventListener('keydown', onKeyDownHandler)
    }, 100)

    return () => {
      codeMirror?.getCodemirror()?.contentDOM.removeEventListener('focus', onFocusHandler)
      codeMirror?.getCodemirror()?.contentDOM.removeEventListener('keydown', onKeyDownHandler)
    }
  }, [codeMirrorRef, onFocusHandler, onKeyDownHandler, language])

  return codeMirrorRef
}
