import { SandpackProvider, CodeEditor as TheEditorFromSandpack } from '@codesandbox/sandpack-react'
import React from 'react'
import styles from '../../styles/ui.module.css'
import { CodeBlockEditorProps } from '../codeblock'
import { useCodeBlockEditorContext } from '../codeblock/CodeBlockNode'
import { readOnly$ } from '../core'
import { useCodeMirrorRef } from '../sandpack/useCodeMirrorRef'
import { useCellValue } from '@mdxeditor/gurx'

export const CodeMirrorEditor = ({ language, nodeKey, code, focusEmitter, theme }: CodeBlockEditorProps) => {
  const codeMirrorRef = useCodeMirrorRef(nodeKey, 'codeblock', 'jsx', focusEmitter)
  const readOnly = useCellValue(readOnly$)
  const { setCode } = useCodeBlockEditorContext()

  React.useEffect(() => {
    codeMirrorRef.current?.getCodemirror()?.dom.addEventListener('paste', (e) => {
      e.stopPropagation()
    })
  }, [codeMirrorRef, language])

  return (
    <div
      className={styles.sandpackWrapper}
      onKeyDown={(e) => {
        e.stopPropagation()
      }}
    >
      <SandpackProvider theme={theme}>
        <TheEditorFromSandpack
          readOnly={readOnly}
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
