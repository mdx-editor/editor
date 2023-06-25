import { SandpackProvider, CodeEditor as TheEditorFromSandpack } from '@codesandbox/sandpack-react'
import React from 'react'
import { useEmitterValues, usePublisher } from '../../system/EditorSystemComponent'
import { CodeBlockEditorProps } from '../../types/NodeDecoratorsProps'
import styles from '../styles.module.css'
import { useCodeMirrorRef } from './useCodeMirrorRef'

export const CodeBlockEditor = ({ nodeKey, code, language, onChange, focusEmitter }: CodeBlockEditorProps) => {
  const [activeEditor] = useEmitterValues('activeEditor')
  const codeMirrorRef = useCodeMirrorRef(nodeKey, 'codeblock', language)
  const setActiveEditorType = usePublisher('activeEditorType')

  React.useEffect(() => {
    focusEmitter.subscribe(() => {
      codeMirrorRef?.current?.getCodemirror()?.focus()
      setActiveEditorType({ type: 'codeblock', nodeKey })
    })
  }, [focusEmitter, codeMirrorRef, setActiveEditorType, nodeKey])

  const wrappedOnChange = React.useCallback(
    (code: string) => {
      activeEditor?.update(() => {
        onChange(code)
      })
    },
    [onChange, activeEditor]
  )

  return (
    <div className={styles.sandpackWrapper}>
      <SandpackProvider>
        <TheEditorFromSandpack
          showLineNumbers
          initMode="immediate"
          key={language}
          filePath={`file.${language || 'txt'}`}
          code={code}
          onCodeUpdate={wrappedOnChange}
          ref={codeMirrorRef}
        />
      </SandpackProvider>
    </div>
  )
}
