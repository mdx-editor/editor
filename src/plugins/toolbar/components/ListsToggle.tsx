import React from 'react'
import BulletedListIcon from '../../../icons/format_list_bulleted.svg'
import NumberedListIcon from '../../../icons/format_list_numbered.svg'
import { listsPluginHooks } from '../../lists'
import { SingleChoiceToggleGroup } from '.././primitives/toolbar'

/**
 * A toolbar toggle that allows the user to toggle between bulleted and numbered lists.
 * Pressing the selected button will convert the current list to the other type. Pressing it again will remove the list.
 * For this button to work, you need to have the `listsPlugin` plugin enabled.
 */
export const ListsToggle: React.FC = () => {
  const [currentListType] = listsPluginHooks.useEmitterValues('currentListType')
  const applyListType = listsPluginHooks.usePublisher('applyListType')
  return (
    <SingleChoiceToggleGroup
      value={currentListType || ''}
      items={[
        { title: 'Bulleted list', contents: <BulletedListIcon />, value: 'bullet' },
        { title: 'Numbered list', contents: <NumberedListIcon />, value: 'number' }
      ]}
      onChange={applyListType}
    />
  )
}
