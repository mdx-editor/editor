/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import React from 'react'
import { useEmitterValues, usePublisher } from '../..'
import ReactDiffViewer from 'react-diff-viewer'
import classNames from 'classnames'

export type ViewMode = 'editor' | 'markdown' | 'diff'

export function MarkdownDiffView({ initialCode }: { initialCode: string }) {
  const [markdown] = useEmitterValues('markdownSource')
  return <ReactDiffViewer oldValue={initialCode} newValue={markdown} splitView={true} />
}

export function MarkdownPlainTextEditor() {
  const [markdown] = useEmitterValues('markdownSource')
  const updateMarkdown = usePublisher('markdownSource')

  return (
    <div
      className={`
grid 
relative 
font-mono
after:w-auto
after:min-w-[1em]
after:font-mono
after:resize-none
after:whitespace-pre-wrap
after:content-[attr(data-value)_"_"]
after:row-start-1
after:row-end-1
after:col-start-1
after:col-end-1
after:text-sm
after:invisible
`}
      data-value={markdown}
    >
      <textarea
        value={markdown}
        className={`outline-none
border-0
p-0
text-sm
w-auto
min-w-[1em]
font-mono
resize-none
whitespace-pre-wrap
row-start-1
row-end-1
col-start-1
col-end-1`}
        onInput={({ target }) => {
          const value = (target as HTMLTextAreaElement).value
          updateMarkdown(value)
          ;((target as HTMLTextAreaElement).parentNode as HTMLDivElement).dataset.value = value
        }}
      />
    </div>
  )
}

export interface ViewModeProps {
  children: React.ReactNode
  initialCode: string
}

export const ViewModeToggler: React.FC<ViewModeProps> = ({ children, initialCode }) => {
  const [viewMode] = useEmitterValues('viewMode')
  // keep the RTE always mounted, otherwise the state is lost
  return (
    <div className="">
      <div style={{ display: viewMode === 'editor' ? 'block' : 'none' }}>{children}</div>
      {viewMode === 'diff' ? <MarkdownDiffView initialCode={initialCode} /> : null}
      {viewMode === 'markdown' ? <MarkdownPlainTextEditor /> : null}
    </div>
  )
}
