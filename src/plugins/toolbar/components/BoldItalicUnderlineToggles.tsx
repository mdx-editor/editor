import { applyFormat$, currentFormat$, iconComponentFor$ } from '../../core'
import { useCellValues, usePublisher } from '@mdxeditor/gurx'
import React from 'react'
import { IS_BOLD, IS_ITALIC, IS_UNDERLINE } from '../../../FormatConstants'
import { MultipleChoiceToggleGroup } from '.././primitives/toolbar'

/**
 * A toolbar component that lets the user toggle bold, italic and underline formatting.
 * @group Toolbar Components
 */
export const BoldItalicUnderlineToggles: React.FC = () => {
  const [currentFormat, iconComponentFor] = useCellValues(currentFormat$, iconComponentFor$)
  const applyFormat = usePublisher(applyFormat$)

  const boldIsOn = (currentFormat & IS_BOLD) !== 0
  const italicIsOn = (currentFormat & IS_ITALIC) !== 0
  const underlineIsOn = (currentFormat & IS_UNDERLINE) !== 0

  const boldTitle = boldIsOn ? 'Remove bold' : 'Bold'
  const italicTitle = italicIsOn ? 'Remove italic' : 'Italic'
  const underlineTitle = underlineIsOn ? 'Remove underline' : 'Underline'

  return (
    <MultipleChoiceToggleGroup
      items={[
        { title: boldTitle, contents: iconComponentFor('format_bold'), active: boldIsOn, onChange: applyFormat.bind(null, 'bold') },
        { title: italicTitle, contents: iconComponentFor('format_italic'), active: italicIsOn, onChange: applyFormat.bind(null, 'italic') },
        {
          title: underlineTitle,
          contents: <div style={{ transform: 'translateY(2px)' }}>{iconComponentFor('format_underlined')}</div>,
          active: underlineIsOn,
          onChange: applyFormat.bind(null, 'underline')
        }
      ]}
    />
  )
}
