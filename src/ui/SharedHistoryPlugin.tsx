import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import React from 'react'
import { useEmitterValues } from '../system'

export const SharedHistoryPlugin = () => {
  const [historyState] = useEmitterValues('historyState')
  return <HistoryPlugin externalHistoryState={historyState} />
}
