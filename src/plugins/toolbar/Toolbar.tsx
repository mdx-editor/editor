import React from 'react'
import { Root, Separator } from './primitives/toolbar'
import { BoldItalicUnderlineToggles } from './BoldItalicUnderlineToggles'
import { CodeToggle } from './CodeToggle'
import { ListsToggle } from './ListsToggle'

export const Toolbar: React.FC = () => {
  return (
    <Root>
      <BoldItalicUnderlineToggles />
      <Separator />
      <CodeToggle />
      <Separator />
      <ListsToggle />
    </Root>
  )
}
