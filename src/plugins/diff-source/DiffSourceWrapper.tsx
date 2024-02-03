import React from 'react'
import { DiffViewer } from './DiffViewer'
import { SourceEditor } from './SourceEditor'
import { markdownProcessingError$, viewMode$ } from '../core'
import styles from '../../styles/ui.module.css'
import { useCellValues } from '@mdxeditor/gurx'

export const DiffSourceWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [error, viewMode] = useCellValues(markdownProcessingError$, viewMode$)
  // keep the RTE always mounted, otherwise the state is lost
  return (
    <div className="mdxeditor-diff-source-wrapper">
      {error ? (
        <div className={styles.markdownParseError}>
          <p>{error.error}.</p>
          <p>You can fix the errors in source mode and switch to rich text mode when you are ready.</p>
        </div>
      ) : null}
      <div className="mdxeditor-rich-text-editor" style={{ display: viewMode === 'rich-text' && error == null ? 'block' : 'none' }}>
        {children}
      </div>
      {viewMode === 'diff' ? <DiffViewer /> : null}
      {viewMode === 'source' ? <SourceEditor /> : null}
    </div>
  )
}
