import React from 'react'
import { IS_HIGHLIGHT } from '../../../FormatConstants'
import { applyFormat$, currentFormat$, iconComponentFor$, useTranslation } from '../../core'
import { MultipleChoiceToggleGroup } from '.././primitives/toolbar'
import { useCellValues, usePublisher } from '@mdxeditor/gurx'

/**
 * A toolbar component that lets the user toggle highlight formatting.
 * @group Toolbar Components
 */
export const HighlightToggle: React.FC = () => {
  const [currentFormat, iconComponentFor] = useCellValues(currentFormat$, iconComponentFor$)
  const applyFormat = usePublisher(applyFormat$)
  const t = useTranslation()

  const highlightIsOn = (currentFormat & IS_HIGHLIGHT) !== 0

  const title = highlightIsOn ? t('toolbar.removeHighlight', 'Remove highlight') : t('toolbar.highlight', 'Highlight')

  return (
    <MultipleChoiceToggleGroup
      items={[
        {
          title: title,
          contents: iconComponentFor('format_highlight'),
          active: highlightIsOn,
          onChange: applyFormat.bind(null, 'highlight')
        }
      ]}
    />
  )
}
