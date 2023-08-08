import React from 'react'
import { thematicBreakPluginHooks } from '../../thematic-break'
import { ButtonWithTooltip } from '.././primitives/toolbar'
import HorizontalRuleIcon from '../../../icons/horizontal_rule.svg'

/**
 * A toolbar button that allows the user to insert a thematic break (rendered as an HR HTML element).
 * For this button to work, you need to have the `thematicBreakPlugin` plugin enabled.
 */
export const InsertThematicBreak: React.FC = () => {
  const insertThematicBreak = thematicBreakPluginHooks.usePublisher('insertThematicBreak')
  return (
    <ButtonWithTooltip title="Insert thematic break" onClick={insertThematicBreak.bind(null, true)}>
      <HorizontalRuleIcon />
    </ButtonWithTooltip>
  )
}
