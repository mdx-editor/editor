import React from 'react'
import { Separator, MultipleChoiceToggleGroup, SingleChoiceToggleGroup, ButtonWithTooltip, Root } from './primitives/toolbar'
import { BoldItalicUnderlineToggles } from './BoldItalicUnderlineToggles'

export const Toolbar: React.FC = () => {
  return (
    <Root>
      <BoldItalicUnderlineToggles />
    </Root>
  )
}
