import { useI18n } from '@/plugins/core/i18n'
import { useCellValue, usePublisher } from '@mdxeditor/gurx'
import React from 'react'
import { iconComponentFor$ } from '../../core'
import { insertThematicBreak$ } from '../../thematic-break'
import { ButtonWithTooltip } from '.././primitives/toolbar'

/**
 * A toolbar button that allows the user to insert a thematic break (rendered as an HR HTML element).
 * For this button to work, you need to have the `thematicBreakPlugin` plugin enabled.
 * @group Toolbar Components
 */
export const InsertThematicBreak: React.FC = () => {
  const i18n = useI18n()
  const insertThematicBreak = usePublisher(insertThematicBreak$)
  const iconComponentFor = useCellValue(iconComponentFor$)
  return (
    <ButtonWithTooltip title={i18n.toolbar.thematicBreak} onClick={() => insertThematicBreak()}>
      {iconComponentFor('horizontal_rule')}
    </ButtonWithTooltip>
  )
}
