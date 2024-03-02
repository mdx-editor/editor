import { useI18n } from '@/plugins/core/i18n'
import { useCellValue, usePublisher } from '@mdxeditor/gurx'
import React from 'react'
import { insertCodeBlock$ } from '../../codeblock/'
import { iconComponentFor$ } from '../../core'
import { ButtonWithTooltip } from '.././primitives/toolbar'

/**
 * A toolbar button that allows the user to insert a fenced code block.
 * Once the code block is focused, you can construct a special code block toolbar for it, using the {@link ConditionalContents} primitive.
 * See the {@link ConditionalContents} documentation for an example.
 *
 * @group Toolbar Components
 */
export const InsertCodeBlock: React.FC = () => {
  const i18n = useI18n()
  const insertCodeBlock = usePublisher(insertCodeBlock$)
  const iconComponentFor = useCellValue(iconComponentFor$)
  return (
    <ButtonWithTooltip
      title={i18n.toolbar.codeBlock}
      onClick={() => {
        insertCodeBlock({})
      }}
    >
      {iconComponentFor('frame_source')}
    </ButtonWithTooltip>
  )
}
