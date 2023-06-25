/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import React from 'react'
import { useEmitterValues, usePublisher } from '../../system/EditorSystemComponent'
import { DiffViewer } from './DiffViewer'
import { CodeMirrorRef } from '@codesandbox/sandpack-react/components/CodeEditor/CodeMirror'
import { SandpackProvider, CodeEditor as TheEditorFromSandpack } from '@codesandbox/sandpack-react'
import { markdown as markdownLanguageSupport } from '@codemirror/lang-markdown'

export function MarkdownDiffView() {
  const [markdown, headMarkdown] = useEmitterValues('markdownSource', 'headMarkdown')
  return <DiffViewer oldText={headMarkdown} newText={markdown} />
}

export interface ViewModeProps {
  children: React.ReactNode
}

export const ViewModeToggler: React.FC<ViewModeProps> = ({ children }) => {
  const [viewMode] = useEmitterValues('viewMode')
  // keep the RTE always mounted, otherwise the state is lost
  return (
    <div>
      <div style={{ display: viewMode === 'editor' ? 'block' : 'none' }}>{children}</div>
      {viewMode === 'diff' ? <MarkdownDiffView /> : null}
      {viewMode === 'markdown' ? <SourceEditor /> : null}
    </div>
  )
}

export const SourceEditor = () => {
  const [markdown] = useEmitterValues('markdownSource')
  const updateMarkdown = usePublisher('markdownSource')
  const codeMirrorRef = React.useRef<CodeMirrorRef>(null)

  return (
    <div>
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
    </div>
  )
}
