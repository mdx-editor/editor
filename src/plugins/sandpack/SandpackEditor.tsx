import { SandpackCodeEditor, SandpackLayout, SandpackPreview, SandpackProvider, useSandpack } from '@codesandbox/sandpack-react'
import { useCellValues } from '@mdxeditor/gurx'
import React from 'react'
import styles from '../../styles/ui.module.css'
import { useCodeBlockEditorContext } from '../codeblock/CodeBlockNode'
import { iconComponentFor$, readOnly$, useTranslation } from '../core'
import { useCodeMirrorRef } from './useCodeMirrorRef'
import { CodeBlockEditorProps } from '../codeblock/utils'
import { SandpackPreset } from './utils'

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
  const [readOnly, iconComponentFor] = useCellValues(readOnly$, iconComponentFor$)
  const { setCode } = useCodeBlockEditorContext()
  const { parentEditor, lexicalNode } = useCodeBlockEditorContext()
  const t = useTranslation()

  return (
    <div className={styles.sandPackWrapper}>
      <div className={styles.codeMirrorToolbar}>
        <button
          className={styles.iconButton}
          type="button"
          title={t('codeblock.delete', 'Delete code block')}
          onClick={(e) => {
            e.preventDefault()
            parentEditor.update(() => {
              lexicalNode.remove()
            })
          }}
        >
          {iconComponentFor('delete_small')}
        </button>
      </div>
      <SandpackProvider
        template={preset.sandpackTemplate}
        theme={preset.sandpackTheme}
        files={{
          [preset.snippetFileName]: code,
          ...Object.entries(preset.files ?? {}).reduce(
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
    </div>
  )
}
