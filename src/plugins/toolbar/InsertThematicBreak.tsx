import React from 'react'
import { thematicBreakPluginHooks } from '../thematic-break/realmPlugin'
import { ButtonWithTooltip } from './primitives/toolbar'
import HorizontalRuleIcon from '../../icons/horizontal_rule.svg'

export const InsertThematicBreak: React.FC = () => {
  const insertThematicBreak = thematicBreakPluginHooks.usePublisher('insertThematicBreak')
  return (
    <ButtonWithTooltip title="Insert thematic break" onClick={insertThematicBreak.bind(null, true)}>
      <HorizontalRuleIcon />
    </ButtonWithTooltip>
  )
}
