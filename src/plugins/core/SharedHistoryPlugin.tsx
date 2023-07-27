import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import React from 'react'
import { corePluginHooks } from './realmPlugin'

export const SharedHistoryPlugin = () => {
  const [historyState] = corePluginHooks.useEmitterValues('historyState')
  return <HistoryPlugin externalHistoryState={historyState} />
}
