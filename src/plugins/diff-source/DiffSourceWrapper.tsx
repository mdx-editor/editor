import React from 'react'
import { diffSourcePluginHooks } from '.'
import { DiffViewer } from './DiffViewer'
import { SourceEditor } from './SourceEditor'
import { corePluginHooks } from '../core'
import styles from '../../styles/ui.module.css'

export const DiffSourceWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [error] = corePluginHooks.useEmitterValues('markdownProcessingError')
  const [viewMode] = diffSourcePluginHooks.useEmitterValues('viewMode')
  // keep the RTE always mounted, otherwise the state is lost
  return (
    <div>
      {error ? (
        <div className={styles.markdownParseError}>
          <p>{error.error}.</p>
          <p>You can fix the errors in source mode and switch to rich text mode when you are ready.</p>
        </div>
      ) : null}
      <div style={{ display: viewMode === 'rich-text' && error == null ? 'block' : 'none' }}>{children}</div>
      {viewMode === 'diff' ? <DiffViewer /> : null}
      {viewMode === 'source' ? <SourceEditor /> : null}
    </div>
  )
}
