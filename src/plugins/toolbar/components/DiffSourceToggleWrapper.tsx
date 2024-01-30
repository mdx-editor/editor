import { iconComponentFor$, ViewMode, viewMode$ } from '../../core'
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
export const DiffSourceToggleWrapper: React.FC<{ children: React.ReactNode; options?: ViewMode[] }> = ({
  children,
  options = ['rich-text', 'diff', 'source']
}) => {
  const [viewMode, iconComponentFor] = useCellValues(viewMode$, iconComponentFor$)
  const changeViewMode = usePublisher(viewMode$)

  const toggleGroupItems: {
    title: string
    contents: React.ReactNode
    value: ViewMode
  }[] = []

  if (options.includes('rich-text')) {
    toggleGroupItems.push({ title: 'Rich text', contents: iconComponentFor('rich_text'), value: 'rich-text' })
  }
  if (options.includes('diff')) {
    toggleGroupItems.push({ title: 'Diff mode', contents: iconComponentFor('difference'), value: 'diff' })
  }
  if (options.includes('source')) {
    toggleGroupItems.push({ title: 'Source', contents: iconComponentFor('markdown'), value: 'source' })
  }

  return (
    <>
      {viewMode === 'rich-text' ? (
        children
      ) : viewMode === 'diff' ? (
        <span className={styles.toolbarTitleMode}>Diff mode</span>
      ) : (
        <span className={styles.toolbarTitleMode}>Source mode</span>
      )}

      <div style={{ marginLeft: 'auto', pointerEvents: 'auto', opacity: 1 }}>
        <SingleChoiceToggleGroup
          className={styles.diffSourceToggle}
          value={viewMode}
          items={toggleGroupItems}
          onChange={(value) => changeViewMode(value || 'rich-text')}
        />
      </div>
    </>
  )
}
