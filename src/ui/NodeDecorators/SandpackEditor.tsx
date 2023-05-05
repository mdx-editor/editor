import { SandpackCodeEditor, SandpackLayout, SandpackPreview, SandpackProvider, useSandpack } from '@codesandbox/sandpack-react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import React from 'react'
import { useEmitterValues, usePublisher } from '../../system'
import { SandpackConfigValue, SandpackPreset } from '../../system/Sandpack'
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

function getPreset(meta: string, config: SandpackConfigValue) {
  let preset!: SandpackPreset | undefined
  const metaObj = parseCodeBlockMeta(meta)
  if (typeof config === 'function') {
    preset = config(metaObj)
  } else {
    const presetName = metaObj.preset || config?.defaultPreset
    preset = config?.presets.find((p) => p.name === presetName)
    if (!preset) {
      throw new Error(`No preset found for name ${presetName}`)
    }
  }
  return preset
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

  const preset = getPreset(meta, config)

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
