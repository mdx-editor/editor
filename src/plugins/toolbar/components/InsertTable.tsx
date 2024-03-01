import { useI18n } from '@/i18n/I18nProvider'
import { useCellValue, usePublisher } from '@mdxeditor/gurx'
import React from 'react'
import { iconComponentFor$ } from '../../core'
import { insertTable$ } from '../../table'
import { ButtonWithTooltip } from '.././primitives/toolbar'

/**
 * A toolbar button that allows the user to insert a table.
 * For this button to work, you need to have the `tablePlugin` plugin enabled.
 * @group Toolbar Components
 */
export const InsertTable: React.FC = () => {
  const i18n = useI18n()
  const iconComponentFor = useCellValue(iconComponentFor$)
  const insertTable = usePublisher(insertTable$)

  return (
    <ButtonWithTooltip
      title={i18n.toolbar.table}
      onClick={() => {
        insertTable({ rows: 3, columns: 3 })
      }}
    >
      {iconComponentFor('table')}
    </ButtonWithTooltip>
  )
}
