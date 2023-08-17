import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin.js'
import React from 'react'
import { corePluginHooks } from '.'

export const SharedHistoryPlugin = () => {
  const [historyState] = corePluginHooks.useEmitterValues('historyState')
  return <HistoryPlugin externalHistoryState={historyState} />
}
