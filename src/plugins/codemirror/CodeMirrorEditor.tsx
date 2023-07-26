import React from 'react'
import { CodeBlockEditorProps } from '../codeblock/realmPlugin'
import { useCodeMirrorRef } from '../sandpack/useCodeMirrorRef'
import { CodeEditor as TheEditorFromSandpack, SandpackProvider } from '@codesandbox/sandpack-react'
import { useCodeBlockEditorContext } from '../codeblock/CodeBlockEditorContainer'
import styles from '../../ui/styles.module.css'

export const CodeMirrorEditor = ({ language, nodeKey, code, focusEmitter }: CodeBlockEditorProps) => {
  const codeMirrorRef = useCodeMirrorRef(nodeKey, 'sandpack', 'jsx')
  const { setCode } = useCodeBlockEditorContext()

  React.useEffect(() => {
    focusEmitter.subscribe(() => {
      codeMirrorRef?.current?.getCodemirror()?.focus()
      // setActiveEditorType({ type: 'sandpack', nodeKey })
    })
  }, [focusEmitter, codeMirrorRef, nodeKey])

  return (
    <div className={styles.sandpackWrapper}>
      <SandpackProvider>
        <TheEditorFromSandpack
          showLineNumbers
          initMode="immediate"
          key={language}
          filePath={`file.${language || 'txt'}`}
          code={code}
          onCodeUpdate={setCode}
          ref={codeMirrorRef}
        />
      </SandpackProvider>
    </div>
  )
}
