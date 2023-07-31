import React from 'react'
import { Root, Separator } from './primitives/toolbar'
import { BoldItalicUnderlineToggles } from './BoldItalicUnderlineToggles'
import { CodeToggle } from './CodeToggle'
import { ListsToggle } from './ListsToggle'
import { BlockTypeSelect } from './BlockTypeSelect'
import { Createlink } from './CreateLink'
import { InsertImage } from './InsertImage'
import { InsertTable } from './InsertTable'
import { InsertThematicBreak } from './InsertThematicBreak'
import { InsertFrontmatter } from './InsertFrontmatter'
import { InsertCodeBlock } from './InsertCodeBlock'
import { InsertSandpack } from './InsertSandpack'
import { InsertAdmonition } from './InsertAdmonition'
import { UndoRedo } from './UndoRedo'
import { DiffSourceToggleWrapper } from './DiffSourceToggleWrapper'

export const Toolbar: React.FC = () => {
  return (
    <Root>
      <DiffSourceToggleWrapper>
        <UndoRedo />
        <Separator />
        <BoldItalicUnderlineToggles />
        <CodeToggle />
        <Separator />
        <ListsToggle />
        <Separator />
        <BlockTypeSelect />
        <Separator />
        <Createlink />
        <Separator />
        <InsertImage />
        <InsertTable />
        <InsertThematicBreak />
        <InsertFrontmatter />
        <InsertCodeBlock />
        <InsertSandpack />
        <InsertAdmonition />
      </DiffSourceToggleWrapper>
    </Root>
  )
}
