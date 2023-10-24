import { SandpackProvider, CodeEditor as TheEditorFromSandpack } from '@codesandbox/sandpack-react'
import React from 'react'
import styles from '../../styles/ui.module.css'
import { CodeBlockEditorProps } from '../codeblock'
import { useCodeBlockEditorContext } from '../codeblock/CodeBlockNode'
import { corePluginHooks } from '../core'
import { useCodeMirrorRef } from '../sandpack/useCodeMirrorRef'

export const CodeMirrorEditor = ({ language, nodeKey, code, focusEmitter }: CodeBlockEditorProps) => {
  const codeMirrorRef = useCodeMirrorRef(nodeKey, 'codeblock', 'jsx', focusEmitter)
  const [readOnly] = corePluginHooks.useEmitterValues('readOnly')
  const { setCode } = useCodeBlockEditorContext()

  React.useEffect(() => {
    codeMirrorRef.current?.getCodemirror()?.dom.addEventListener('paste', (e) => {
      e.stopPropagation()
    })
  }, [codeMirrorRef])

  return (
    <div
      className={styles.sandpackWrapper}
      onKeyDown={(e) => {
        e.stopPropagation()
      }}
    >
      <SandpackProvider>
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
