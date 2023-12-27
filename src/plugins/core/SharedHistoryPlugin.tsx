import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin.js'
import React from 'react'
import { historyState$ } from '.'
import { useCellValue } from '@mdxeditor/gurx'

export const SharedHistoryPlugin = () => {
  return <HistoryPlugin externalHistoryState={useCellValue(historyState$)} />
}
