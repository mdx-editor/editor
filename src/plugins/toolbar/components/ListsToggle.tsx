import React from 'react'
import BulletedListIcon from '../../../icons/format_list_bulleted.svg'
import NumberedListIcon from '../../../icons/format_list_numbered.svg'
import { listsPluginHooks } from '../../lists'
import { SingleChoiceToggleGroup } from '.././primitives/toolbar'

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
