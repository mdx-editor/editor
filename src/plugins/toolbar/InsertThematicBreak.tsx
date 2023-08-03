import React from 'react'
import { thematicBreakPluginHooks } from '../thematic-break'
import { ButtonWithTooltip } from './primitives/toolbar'
import HorizontalRuleIcon from '../../icons/horizontal_rule.svg'
import { RequirePlugin } from '../../gurx'

const InnerInsertThematicBreak: React.FC = () => {
  const insertThematicBreak = thematicBreakPluginHooks.usePublisher('insertThematicBreak')
  return (
    <ButtonWithTooltip title="Insert thematic break" onClick={insertThematicBreak.bind(null, true)}>
      <HorizontalRuleIcon />
    </ButtonWithTooltip>
  )
}

export const InsertThematicBreak = () => {
  return (
    <RequirePlugin id="thematic-break">
      <InnerInsertThematicBreak />
    </RequirePlugin>
  )
}
