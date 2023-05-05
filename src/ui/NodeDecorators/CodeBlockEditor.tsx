import { CodeEditor as TheEditorFromSandpack, SandpackProvider } from '@codesandbox/sandpack-react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import React from 'react'
import { CodeBlockEditorProps } from '../../types/NodeDecoratorsProps'
import { useCodeMirrorRef } from './useCodeMirrorRef'
import { useEmitterValues, usePublisher } from '../../system'

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
      activeEditor.update(() => {
        onChange(code)
      })
    },
    [onChange, activeEditor]
  )

  return (
    <div className="mb-5">
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
