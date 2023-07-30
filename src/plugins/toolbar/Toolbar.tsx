import React from 'react'
import { Root, Separator } from './primitives/toolbar'
import { BoldItalicUnderlineToggles } from './BoldItalicUnderlineToggles'
import { CodeToggle } from './CodeToggle'
import { ListsToggle } from './ListsToggle'
import { BlockTypeSelect } from './BlockTypeSelect'
import { Createlink } from './CreateLink'
import { InsertImage } from './InsertImage'

export const Toolbar: React.FC = () => {
  return (
    <Root>
      <BoldItalicUnderlineToggles />
      <Separator />
      <CodeToggle />
      <Separator />
      <ListsToggle />
      <Separator />
      <BlockTypeSelect />
      <Separator />
      <Createlink />
      <Separator />
      <InsertImage />
    </Root>
  )
}
