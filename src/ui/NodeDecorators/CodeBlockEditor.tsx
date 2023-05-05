import { CodeEditor as TheEditorFromSandpack, SandpackProvider } from '@codesandbox/sandpack-react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import React from 'react'
import { CodeBlockEditorProps } from '../../types/NodeDecoratorsProps'
import { useCodeMirrorRef } from './useCodeMirrorRef'

export const CodeBlockEditor = ({ nodeKey, code, language, onChange, focusEmitter }: CodeBlockEditorProps) => {
  const [editor] = useLexicalComposerContext()
  const codeMirrorRef = useCodeMirrorRef(nodeKey, 'codeblock')

  React.useEffect(() => {
    focusEmitter.subscribe(() => {
      codeMirrorRef?.current?.getCodemirror()?.focus()
    })
  }, [focusEmitter, codeMirrorRef])

  const wrappedOnChange = React.useCallback(
    (code: string) => {
      editor.update(() => {
        onChange(code)
      })
    },
    [onChange, editor]
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
