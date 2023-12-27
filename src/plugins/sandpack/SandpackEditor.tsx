import React from 'react'
import { SandpackPreset } from '.'
import { CodeBlockEditorProps } from '../codeblock'
import { useCodeMirrorRef } from './useCodeMirrorRef'
import { SandpackCodeEditor, SandpackLayout, SandpackPreview, SandpackProvider, useSandpack } from '@codesandbox/sandpack-react'
import { useCodeBlockEditorContext } from '../codeblock/CodeBlockNode'
import { readOnly$ } from '../core'
import { useCellValue } from '@mdxeditor/gurx'

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
  const codeMirrorRef = useCodeMirrorRef(nodeKey, 'sandpack', 'jsx', focusEmitter)
  const readOnly = useCellValue(readOnly$)
  const { setCode } = useCodeBlockEditorContext()

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
        <SandpackCodeEditor readOnly={readOnly} showLineNumbers showInlineErrors ref={codeMirrorRef} />
        <SandpackPreview />
      </SandpackLayout>
      <CodeUpdateEmitter onChange={setCode} snippetFileName={preset.snippetFileName} />
    </SandpackProvider>
  )
}
