import React from 'react'
import { IS_CODE } from '../../../FormatConstants'
import { applyFormat$, currentFormat$, iconComponentFor$, useTranslation } from '../../core'
import { MultipleChoiceToggleGroup } from '.././primitives/toolbar'
import { useCellValues, usePublisher } from '@mdxeditor/gurx'

/**
 * A toolbar component that lets the user toggle code formatting.
 * Use for inline `code` elements (like variables, methods, etc).
 * @group Toolbar Components
 */
export const CodeToggle: React.FC = () => {
  const [currentFormat, iconComponentFor] = useCellValues(currentFormat$, iconComponentFor$)
  const applyFormat = usePublisher(applyFormat$)
  const t = useTranslation()

  const codeIsOn = (currentFormat & IS_CODE) !== 0

  const title = codeIsOn ? t('toolbar.removeInlineCode', 'Remove code format') : t('toolbar.inlineCode', 'Inline code format')

  return (
    <MultipleChoiceToggleGroup
      items={[{ title: title, contents: iconComponentFor('code'), active: codeIsOn, onChange: applyFormat.bind(null, 'code') }]}
    />
  )
}
