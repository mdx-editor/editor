import React from 'react'
import { applyListType$, currentListType$ } from '../../lists'
import { SingleChoiceToggleGroup } from '.././primitives/toolbar'
import { useCellValues, usePublisher } from '@mdxeditor/gurx'
import { iconComponentFor$ } from '../../core'

/**
 * A toolbar toggle that allows the user to toggle between bulleted and numbered lists.
 * Pressing the selected button will convert the current list to the other type. Pressing it again will remove the list.
 * For this button to work, you need to have the `listsPlugin` plugin enabled.
 * @group Toolbar Components
 */
export const ListsToggle: React.FC = () => {
  const [currentListType, iconComponentFor] = useCellValues(currentListType$, iconComponentFor$)
  const applyListType = usePublisher(applyListType$)
  return (
    <SingleChoiceToggleGroup
      value={currentListType || ''}
      items={[
        { title: 'Bulleted list', contents: iconComponentFor('format_list_bulleted'), value: 'bullet' },
        { title: 'Numbered list', contents: iconComponentFor('format_list_numbered'), value: 'number' },
        { title: 'Check list', contents: iconComponentFor('format_list_checked'), value: 'check' }
      ]}
      onChange={applyListType}
    />
  )
}
