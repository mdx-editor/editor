import React from 'react'
import { diffSourcePluginHooks } from '.'
import { DiffViewer } from './DiffViewer'
import { SourceEditor } from './SourceEditor'

export const DiffSourceWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [viewMode] = diffSourcePluginHooks.useEmitterValues('viewMode')
  // keep the RTE always mounted, otherwise the state is lost
  return (
    <div>
      <div style={{ display: viewMode === 'rich-text' ? 'block' : 'none' }}>{children}</div>
      {viewMode === 'diff' ? <DiffViewer /> : null}
      {viewMode === 'source' ? <SourceEditor /> : null}
    </div>
  )
}
