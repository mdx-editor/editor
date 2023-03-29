/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import React from 'react'
import { useEmitterValues, usePublisher } from '../..'
import ReactDiffViewer from 'react-diff-viewer'
import { AutogrowTextarea, AutoGrowTextareaWrapper } from './styles.css'
import { themeClassName } from '../theme.css'

export type ViewMode = 'editor' | 'markdown' | 'diff'

export function MarkdownDiffView({ initialCode }: { initialCode: string }) {
  const [markdown] = useEmitterValues('markdownSource')
  return <ReactDiffViewer oldValue={initialCode} newValue={markdown} splitView={true} />
}

export function MarkdownPlainTextEditor() {
  const [markdown] = useEmitterValues('markdownSource')
  const updateMarkdown = usePublisher('markdownSource')

  return (
    <div className={AutoGrowTextareaWrapper} data-value={markdown}>
      <textarea
        value={markdown}
        className={AutogrowTextarea}
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
    <div className={themeClassName}>
      <div style={{ display: viewMode === 'editor' ? 'block' : 'none' }}>{children}</div>
      {viewMode === 'diff' ? <MarkdownDiffView initialCode={initialCode} /> : null}
      {viewMode === 'markdown' ? <MarkdownPlainTextEditor /> : null}
    </div>
  )
}
