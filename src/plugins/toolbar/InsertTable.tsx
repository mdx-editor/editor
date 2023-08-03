import { ButtonWithTooltip } from './primitives/toolbar'
import React from 'react'
import { tablePluginHooks } from '../table'
import TableIcon from '../../icons/table.svg'
import { RequirePlugin } from '../../gurx'

const InnerInsertTable: React.FC = () => {
  const insertTable = tablePluginHooks.usePublisher('insertTable')

  return (
    <ButtonWithTooltip
      title="Insert table"
      onClick={() => {
        insertTable(true)
      }}
    >
      <TableIcon />
    </ButtonWithTooltip>
  )
}

export const InsertTable = () => {
  return (
    <RequirePlugin id="table">
      <InnerInsertTable />
    </RequirePlugin>
  )
}
