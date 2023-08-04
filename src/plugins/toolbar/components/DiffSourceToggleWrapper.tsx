import React from 'react'
import { diffSourcePluginHooks } from '../../diff-source'
import { SingleChoiceToggleGroup } from '.././primitives/toolbar'
import RichTextIcon from '../../../icons/rich_text.svg'
import DiffIcon from '../../../icons/difference.svg'
import SourceIcon from '../../../icons/markdown.svg'
import styles from '../../../styles/ui.module.css'

export const DiffSourceToggleWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [viewMode] = diffSourcePluginHooks.useEmitterValues('viewMode')
  const changeViewMode = diffSourcePluginHooks.usePublisher('viewMode')

  return (
    <>
      {viewMode === 'rich-text' ? (
        children
      ) : viewMode === 'diff' ? (
        <span className={styles.toolbarTitleMode}>Diff mode</span>
      ) : (
        <span className={styles.toolbarTitleMode}>Source mode</span>
      )}

      <div style={{ marginLeft: 'auto' }}>
        <SingleChoiceToggleGroup
          className={styles.diffSourceToggle}
          value={viewMode}
          items={[
            { title: 'Rich text', contents: <RichTextIcon />, value: 'rich-text' },
            { title: 'Diff mode', contents: <DiffIcon />, value: 'diff' },
            { title: 'Source', contents: <SourceIcon />, value: 'source' }
          ]}
          onChange={(value) => changeViewMode(value || 'rich-text')}
        />
      </div>
    </>
  )
}
