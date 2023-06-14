import { SandpackCodeEditor, SandpackLayout, SandpackPreview, SandpackProvider, useSandpack } from '@codesandbox/sandpack-react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import React from 'react'
import { useEmitterValues, usePublisher } from '../../system'
import { SandpackConfig, SandpackConfigValue, SandpackPreset } from '../../system/Sandpack'
import { SandpackEditorProps } from '../../types/NodeDecoratorsProps'
import { parseCodeBlockMeta } from './parseCodeBlockMeta'
import { useCodeMirrorRef } from './useCodeMirrorRef'

interface CodeUpdateEmitterProps {
  snippetFileName: string
  onChange: (code: string) => void
}

const CodeUpdateEmitter = ({ onChange, snippetFileName }: CodeUpdateEmitterProps) => {
  const { sandpack } = useSandpack()
  onChange(sandpack.files[snippetFileName].code)
  return null
}

function getPresetOrDefault(meta: string, config: SandpackConfig) {
  return config.presets.find((preset) => preset.meta === meta) || config.presets.find((preset) => preset.name === config.defaultPreset)
}

export const SandpackEditor = ({ nodeKey, code, meta, onChange, focusEmitter }: SandpackEditorProps) => {
  const [editor] = useLexicalComposerContext()
  const [config] = useEmitterValues('sandpackConfig')
  const codeMirrorRef = useCodeMirrorRef(nodeKey, 'sandpack', 'jsx')
  const setActiveEditorType = usePublisher('activeEditorType')

  React.useEffect(() => {
    focusEmitter.subscribe(() => {
      codeMirrorRef?.current?.getCodemirror()?.focus()
      setActiveEditorType({ type: 'sandpack', nodeKey })
    })
  }, [focusEmitter, codeMirrorRef, setActiveEditorType, nodeKey])

  const wrappedOnChange = React.useCallback(
    (code: string) => {
      editor.update(() => {
        onChange(code)
      })
    },
    [onChange, editor]
  )

  const preset = getPresetOrDefault(meta, config)
  if (!preset) {
    throw new Error(`No sandpack preset found for meta: ${meta}`)
  }

  return (
    <SandpackProvider
      template={preset.sandpackTemplate}
      theme={preset.sandpackTheme}
      files={{
        [preset.snippetFileName]: code,
        ...Object.entries(preset.files || {}).reduce(
          (acc, [filePath, fileContents]) => ({ ...acc, ...{ [filePath]: { code: fileContents, readOnly: true } } }),
          {}
        ),
      }}
      customSetup={{
        dependencies: preset.dependencies,
      }}
    >
      <SandpackLayout>
        <SandpackCodeEditor showLineNumbers showInlineErrors ref={codeMirrorRef} />
        <SandpackPreview />
      </SandpackLayout>
      <CodeUpdateEmitter onChange={wrappedOnChange} snippetFileName={preset.snippetFileName} />
    </SandpackProvider>
  )
}
