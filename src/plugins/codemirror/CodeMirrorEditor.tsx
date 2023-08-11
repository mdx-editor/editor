import React from 'react'
import { CodeBlockEditorProps } from '../codeblock'
import { useCodeMirrorRef } from '../sandpack/useCodeMirrorRef'
import { CodeEditor as TheEditorFromSandpack, SandpackProvider } from '@codesandbox/sandpack-react'
import { useCodeBlockEditorContext } from '../codeblock/CodeBlockNode'
import styles from '../../styles/ui.module.css'

export const CodeMirrorEditor = ({ language, nodeKey, code, focusEmitter }: CodeBlockEditorProps) => {
  const codeMirrorRef = useCodeMirrorRef(nodeKey, 'codeblock', 'jsx', focusEmitter)
  const { setCode } = useCodeBlockEditorContext()

  return (
    <div
      className={styles.sandpackWrapper}
      onKeyDown={(e) => {
        e.stopPropagation()
      }}
    >
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
