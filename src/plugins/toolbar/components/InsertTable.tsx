import { ButtonWithTooltip } from '.././primitives/toolbar'
import React from 'react'
import { insertTable$ } from '../../table'
import { Cell, map, useCellValue, usePublisher } from '@mdxeditor/gurx'
import { activeEditor$, iconComponentFor$, useTranslation } from '../../core'

const disableInsertTableButton$ = Cell<boolean>(false, (r) => {
  r.link(
    r.pipe(
      activeEditor$,
      map((editor) => ['td', 'th'].includes(editor?.getRootElement()?.parentNode?.nodeName.toLowerCase() ?? ''))
    ),
    disableInsertTableButton$
  )
})

/**
 * A toolbar button that allows the user to insert a table.
 * For this button to work, you need to have the `tablePlugin` plugin enabled.
 * @group Toolbar Components
 */
export const InsertTable: React.FC = () => {
  const iconComponentFor = useCellValue(iconComponentFor$)
  const insertTable = usePublisher(insertTable$)
  const t = useTranslation()

  // Do not allow inserting a table inside a table cell, markdown does not support it
  const isDisabled = useCellValue(disableInsertTableButton$)

  return (
    <ButtonWithTooltip
      title={t('toolbar.table', 'Insert Table')}
      onClick={() => {
        insertTable({ rows: 3, columns: 3 })
      }}
      {...(isDisabled ? { 'aria-disabled': true, 'data-disabled': true, disabled: true } : {})}
    >
      {iconComponentFor('table')}
    </ButtonWithTooltip>
  )
}
