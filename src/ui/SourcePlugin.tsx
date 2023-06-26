/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { markdown as markdownLanguageSupport } from '@codemirror/lang-markdown'
import { SandpackProvider, CodeEditor as TheEditorFromSandpack } from '@codesandbox/sandpack-react'
import { CodeMirrorRef } from '@codesandbox/sandpack-react/components/CodeEditor/CodeMirror'
import React from 'react'
import { Diff, Hunk, parseDiff } from 'react-diff-view'
import { diffLines, formatLines } from 'unidiff'
import { useEmitterValues, usePublisher } from '../system/EditorSystemComponent'

import 'react-diff-view/style/index.css'

export function DiffViewer({ oldText, newText }: { oldText: string; newText: string }) {
  const diffText = formatLines(diffLines(oldText, newText), { context: 3 })
  if (diffText.trim() === '') return <div>No changes</div>
  const [diff] = parseDiff(diffText, { nearbySequences: 'zip' })

  return (
    <Diff viewType="split" diffType="modify" hunks={diff.hunks || []}>
      {(hunks) => hunks.map((hunk) => <Hunk key={hunk.content} hunk={hunk} />)}
    </Diff>
  )
}

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
