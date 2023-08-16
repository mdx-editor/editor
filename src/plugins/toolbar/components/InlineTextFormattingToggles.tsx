import React from 'react'
import { corePluginHooks } from '../../core'
import { IS_BOLD, IS_HIGHLIGHT, IS_ITALIC, IS_STRIKETHROUGH, IS_SUBSCRIPT, IS_SUPERSCRIPT, IS_UNDERLINE } from '../../../FormatConstants'
import { MultipleChoiceToggleGroup } from '../primitives/toolbar'
import BoldIcon from '../../../icons/format_bold.svg'
import ItalicIcon from '../../../icons/format_italic.svg'
import UnderlinedIcon from '../../../icons/format_underlined.svg'
import StrikethroughIcon from '../../../icons/format_strikethrough.svg'
import SuperscriptIcon from '../../../icons/format_superscript.svg'
import SubscriptIcon from '../../../icons/format_subscript.svg'
import HighlightIcon from '../../../icons/format_highlight.svg'

/**
 * A toolbar component that lets the user toggle basic text formatting options - bold, italics, underline, strikethrough, subscript, superscript and highlight.
 */
export const InlineTextFormattingToggles: React.FC = () => {
  const [currentFormat] = corePluginHooks.useEmitterValues('currentFormat')
  const applyFormat = corePluginHooks.usePublisher('applyFormat')

  const boldIsOn = (currentFormat & IS_BOLD) !== 0
  const italicIsOn = (currentFormat & IS_ITALIC) !== 0
  const underlineIsOn = (currentFormat & IS_UNDERLINE) !== 0
  const strikethroughIsOn = (currentFormat & IS_STRIKETHROUGH) !== 0
  const subscriptIsOn = (currentFormat & IS_SUBSCRIPT) !== 0
  const superscriptIsOn = (currentFormat & IS_SUPERSCRIPT) !== 0
  const highlightIsOn = (currentFormat & IS_HIGHLIGHT) !== 0

  const boldTitle = boldIsOn ? 'Remove bold' : 'Bold'
  const italicTitle = italicIsOn ? 'Remove italic' : 'Italic'
  const underlineTitle = underlineIsOn ? 'Remove underline' : 'Underline'
  const strikethroughTitle = strikethroughIsOn ? 'Remove strikethrough' : 'Strikethrough'
  const subscriptTitle = subscriptIsOn ? 'Remove subscript' : 'Subscript'
  const superscriptTitle = superscriptIsOn ? 'Remove superscript' : 'Superscript'
  const highlightTitle = highlightIsOn ? 'Remove highlight' : 'Highlight'

  return (
    <MultipleChoiceToggleGroup
      items={[
        { title: boldTitle, contents: <BoldIcon />, active: boldIsOn, onChange: applyFormat.bind(null, 'bold') },
        { title: italicTitle, contents: <ItalicIcon />, active: italicIsOn, onChange: applyFormat.bind(null, 'italic') },
        {
          title: underlineTitle,
          contents: <UnderlinedIcon style={{ transform: 'translateY(2px)' }} />,
          active: underlineIsOn,
          onChange: applyFormat.bind(null, 'underline')
        },
        {
          title: strikethroughTitle,
          contents: <StrikethroughIcon />,
          active: strikethroughIsOn,
          onChange: applyFormat.bind(null, 'strikethrough')
        },
        {
          title: subscriptTitle,
          contents: <SubscriptIcon />,
          active: subscriptIsOn,
          onChange: applyFormat.bind(null, 'subscript')
        },
        {
          title: superscriptTitle,
          contents: <SuperscriptIcon />,
          active: superscriptIsOn,
          onChange: applyFormat.bind(null, 'superscript')
        },
        {
          title: highlightTitle,
          contents: <HighlightIcon />,
          active: highlightIsOn,
          onChange: applyFormat.bind(null, 'highlight')
        }
      ]}
    />
  )
}
