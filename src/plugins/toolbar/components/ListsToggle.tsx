import React from 'react'
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
  const [iconComponentFor] = listsPluginHooks.useEmitterValues('iconComponentFor')
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
