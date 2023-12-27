import { ButtonWithTooltip } from '.././primitives/toolbar'
import React from 'react'
import { insertTable$ } from '../../table'
import { useCellValue, usePublisher } from '@mdxeditor/gurx'
import { iconComponentFor$ } from '../../core'

/**
 * A toolbar button that allows the user to insert a table.
 * For this button to work, you need to have the `tablePlugin` plugin enabled.
 * @group Toolbar Components
 */
export const InsertTable: React.FC = () => {
  const iconComponentFor = useCellValue(iconComponentFor$)
  const insertTable = usePublisher(insertTable$)

  return (
    <ButtonWithTooltip
      title="Insert table"
      onClick={() => {
        insertTable({ rows: 3, columns: 3 })
      }}
    >
      {iconComponentFor('table')}
    </ButtonWithTooltip>
  )
}
