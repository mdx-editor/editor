import { iconComponentFor$, useTranslation, ViewMode, viewMode$ } from '../../core'
import { useCellValues, usePublisher } from '@mdxeditor/gurx'
import React from 'react'
import styles from '../../../styles/ui.module.css'
import { SingleChoiceToggleGroup } from '.././primitives/toolbar'

/**
 * A wrapper element for the toolbar contents that lets the user toggle between rich text, diff and source mode.
 * Put the rich text toolbar contents as children of this component.
 * For this component to work, you must include the `diffSourcePlugin`.
 *
 * @example
 * ```tsx
 *  <MDXEditor markdown='Hello world'
 *    plugins={[toolbarPlugin({
 *      toolbarContents: () => ( <> <DiffSourceToggleWrapper><UndoRedo /><BoldItalicUnderlineToggles /></DiffSourceToggleWrapper></>)
 *    }), diffSourcePlugin()]}
 *  />
 * ```
 *
 * @group Toolbar Components
 */
export const DiffSourceToggleWrapper: React.FC<{ children: React.ReactNode; options?: ViewMode[]; SourceToolbar?: React.ReactNode }> = ({
  children,
  SourceToolbar,
  options = ['rich-text', 'diff', 'source']
}) => {
  const [viewMode, iconComponentFor] = useCellValues(viewMode$, iconComponentFor$)
  const changeViewMode = usePublisher(viewMode$)
  const t = useTranslation()

  const toggleGroupItems: {
    title: string
    contents: React.ReactNode
    value: ViewMode
  }[] = []

  if (options.includes('rich-text')) {
    toggleGroupItems.push({ title: t('toolbar.richText', 'Rich text'), contents: iconComponentFor('rich_text'), value: 'rich-text' })
  }
  if (options.includes('diff')) {
    toggleGroupItems.push({ title: t('toolbar.diffMode', 'Diff mode'), contents: iconComponentFor('difference'), value: 'diff' })
  }
  if (options.includes('source')) {
    toggleGroupItems.push({ title: t('toolbar.source', 'Source mode'), contents: iconComponentFor('markdown'), value: 'source' })
  }

  return (
    <>
      {viewMode === 'rich-text' ? (
        children
      ) : viewMode === 'diff' ? (
        <span className={styles.toolbarTitleMode}>{t('toolbar.diffMode', 'Diff mode')}</span>
      ) : (
        SourceToolbar ?? <span className={styles.toolbarTitleMode}>{t('toolbar.source', 'Source mode')}</span>
      )}

      <div
        style={{ marginLeft: 'auto', pointerEvents: 'auto', opacity: 1, position: 'sticky', right: 0, backgroundColor: 'var(--baseBase)' }}
      >
        <SingleChoiceToggleGroup
          className={styles.diffSourceToggle}
          value={viewMode}
          items={toggleGroupItems}
          onChange={(value) => {
            changeViewMode(value === '' ? 'rich-text' : value)
          }}
        />
      </div>
    </>
  )
}
