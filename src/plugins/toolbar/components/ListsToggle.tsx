import React from 'react'
import { applyListType$, currentListType$ } from '../../lists'
import { SingleChoiceToggleGroup } from '.././primitives/toolbar'
import { useCellValues, usePublisher } from '@mdxeditor/gurx'
import { iconComponentFor$, useTranslation } from '../../core'
import styles from '@/styles/ui.module.css'

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
export const ListsToggle: React.FC<{
  options?: ('bullet' | 'number' | 'check')[]
}> = ({ options = ['bullet', 'number', 'check'] }) => {
  const [currentListType, iconComponentFor] = useCellValues(currentListType$, iconComponentFor$)
  const applyListType = usePublisher(applyListType$)
  const t = useTranslation()

  const LIST_TITLE_MAP = {
    bullet: t('toolbar.bulletedList', 'Bulleted list'),
    number: t('toolbar.numberedList', 'Numbered list'),
    check: t('toolbar.checkList', 'Check list')
  } as const

  const items = options.map((type) => ({
    value: type,
    title: LIST_TITLE_MAP[type],
    contents: iconComponentFor(ICON_NAME_MAP[type])
  }))

  return (
    <div className={styles.toolbarGroupOfGroups}>
      <SingleChoiceToggleGroup
        aria-label={t('toolbar.toggleGroup', 'toggle group')}
        value={currentListType || ''}
        items={items}
        onChange={applyListType}
      />
    </div>
  )
}
