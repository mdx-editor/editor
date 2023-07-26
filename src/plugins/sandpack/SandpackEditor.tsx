import React from 'react'
import { SandpackPreset } from './realmPlugin'
import { CodeBlockEditorProps } from '../codeblock/realmPlugin'
import { useCodeMirrorRef } from './useCodeMirrorRef'
import { SandpackCodeEditor, SandpackLayout, SandpackPreview, SandpackProvider, useSandpack } from '@codesandbox/sandpack-react'
import { useCodeBlockEditorContext } from '../codeblock/CodeBlockEditorContainer'

interface CodeUpdateEmitterProps {
  snippetFileName: string
  onChange: (code: string) => void
}

const CodeUpdateEmitter = ({ onChange, snippetFileName }: CodeUpdateEmitterProps) => {
  const { sandpack } = useSandpack()
  onChange(sandpack.files[snippetFileName].code)
  return null
}

export interface SandpackEditorProps extends CodeBlockEditorProps {
  preset: SandpackPreset
}

export const SandpackEditor = ({ nodeKey, code, focusEmitter, preset }: SandpackEditorProps) => {
  const codeMirrorRef = useCodeMirrorRef(nodeKey, 'sandpack', 'jsx')
  const { setCode } = useCodeBlockEditorContext()

  React.useEffect(() => {
    focusEmitter.subscribe(() => {
      codeMirrorRef?.current?.getCodemirror()?.focus()
      // setActiveEditorType({ type: 'sandpack', nodeKey })
    })
  }, [focusEmitter, codeMirrorRef, nodeKey])

  return (
    <SandpackProvider
      template={preset.sandpackTemplate}
      theme={preset.sandpackTheme}
      files={{
        [preset.snippetFileName]: code,
        ...Object.entries(preset.files || {}).reduce(
          (acc, [filePath, fileContents]) => ({ ...acc, ...{ [filePath]: { code: fileContents, readOnly: true } } }),
          {}
        )
      }}
      customSetup={{
        dependencies: preset.dependencies
      }}
    >
      <SandpackLayout>
        <SandpackCodeEditor showLineNumbers showInlineErrors ref={codeMirrorRef} />
        <SandpackPreview />
      </SandpackLayout>
      <CodeUpdateEmitter onChange={setCode} snippetFileName={preset.snippetFileName} />
    </SandpackProvider>
  )
}
