import React from 'react'
import { thematicBreakPluginHooks } from '../../thematic-break'
import { ButtonWithTooltip } from '.././primitives/toolbar'

/**
 * A toolbar button that allows the user to insert a thematic break (rendered as an HR HTML element).
 * For this button to work, you need to have the `thematicBreakPlugin` plugin enabled.
 */
export const InsertThematicBreak: React.FC = () => {
  const insertThematicBreak = thematicBreakPluginHooks.usePublisher('insertThematicBreak')
  const [iconComponentFor] = thematicBreakPluginHooks.useEmitterValues('iconComponentFor')
  return (
    <ButtonWithTooltip title="Insert thematic break" onClick={insertThematicBreak.bind(null, true)}>
      {iconComponentFor('horizontal_rule')}
    </ButtonWithTooltip>
  )
}
