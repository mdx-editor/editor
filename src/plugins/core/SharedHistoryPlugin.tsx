import { HistoryPlugin, createEmptyHistoryState } from '@lexical/react/LexicalHistoryPlugin.js'
import React from 'react'
import { Cell, useCellValue } from '@mdxeditor/gurx'

const historyState$ = Cell(createEmptyHistoryState())

export const SharedHistoryPlugin = () => {
  return <HistoryPlugin externalHistoryState={useCellValue(historyState$)} />
}
