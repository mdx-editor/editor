import { markdown as markdownLanguageSupport } from '@codemirror/lang-markdown'
import type { CodeMirrorRef } from '@codesandbox/sandpack-react/components/CodeEditor/CodeMirror'
import { SandpackProvider, CodeEditor as TheEditorFromSandpack } from '@codesandbox/sandpack-react'
import React from 'react'
import { useEmitterValues, usePublisher } from '../system/EditorSystemComponent'

export const SourceEditor = () => {
  const [markdown] = useEmitterValues('markdownSourceFromEditor')
  const updateMarkdown = usePublisher('markdownSourceFromEditor')
  const codeMirrorRef = React.useRef<CodeMirrorRef>(null)

  return (
    <div>
      <React.Suspense fallback={null}>
        <SandpackProvider>
          <TheEditorFromSandpack
            showLineNumbers
            additionalLanguages={[{ name: 'markdown', extensions: ['md'], language: markdownLanguageSupport() }]}
            initMode="lazy"
            filePath={`file.md`}
            code={markdown}
            onCodeUpdate={updateMarkdown}
            ref={codeMirrorRef}
          />
        </SandpackProvider>
      </React.Suspense>
    </div>
  )
}
