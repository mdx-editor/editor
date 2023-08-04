import { markdown as markdownLanguageSupport } from '@codemirror/lang-markdown'
import type { CodeMirrorRef } from '@codesandbox/sandpack-react/components/CodeEditor/CodeMirror'
import { SandpackProvider, CodeEditor as TheEditorFromSandpack } from '@codesandbox/sandpack-react'
import React from 'react'
import { diffSourcePluginHooks } from '.'
import { corePluginHooks } from '../core'

export const SourceEditor = () => {
  const [markdown] = corePluginHooks.useEmitterValues('markdown')
  const updateMarkdown = diffSourcePluginHooks.usePublisher('markdownSourceEditorValue')
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
