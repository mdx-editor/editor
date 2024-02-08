import React from 'react'
import { applyListType$, currentListType$ } from '../../lists'
import { SingleChoiceToggleGroup } from '.././primitives/toolbar'
import { useCellValues, usePublisher } from '@mdxeditor/gurx'
import { iconComponentFor$ } from '../../core'

const LIST_TITLE_MAP = {
  bullet: 'Bulleted list',
  number: 'Numbered list',
  check: 'Check list'
} as const

const ICON_NAME_MAP = {
  bullet: 'format_list_bulleted',
  number: 'format_list_numbered',
  check: 'format_list_checked'
} as const

/**
 * A toolbar toggle that allows the user to toggle between bulleted, numbered, and check lists.
 * Pressing the selected button will convert the current list to the other type. Pressing it again will remove the list.
 * For this button to work, you need to have the `listsPlugin` plugin enabled.
 * @group Toolbar Components
 * @param options - The list types that the user can toggle between. Defaults to `['bullet', 'number', 'check']`.
 */
export const ListsToggle: React.FC<{ options?: Array<'bullet' | 'number' | 'check'> }> = ({ options = ['bullet', 'number', 'check'] }) => {
  const [currentListType, iconComponentFor] = useCellValues(currentListType$, iconComponentFor$)
  const applyListType = usePublisher(applyListType$)
  const items = options.map((type) => ({
    value: type,
    title: LIST_TITLE_MAP[type],
    contents: iconComponentFor(ICON_NAME_MAP[type])
  }))

  return <SingleChoiceToggleGroup value={currentListType || ''} items={items} onChange={applyListType} />
}
