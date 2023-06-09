import React from 'react'
import * as Select from '@radix-ui/react-select'
import { AdmonitionKind } from '../../../nodes'
import { useEmitterValues, usePublisher } from '../../../system'
import { SelectItem, SelectTrigger, SelectContent } from '../SelectPieces'

export type HeadingType = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
export type BlockType = 'paragraph' | 'code' | 'quote' | HeadingType
export interface BLockTypeSelectProps {
  value: BlockType | AdmonitionKind | ''
  onValueChange: (value: BlockType) => void
}

export const BlockTypeSelect = () => {
  const [currentBlockType] = useEmitterValues('currentBlockType')
  const applyBlockType = usePublisher('applyBlockType')
  return (
    <Select.Root value={currentBlockType || ('' as const)} onValueChange={applyBlockType as (value: string) => void}>
      <SelectTrigger placeholder="Block type" />
      <SelectContent>
        <SelectItem value="paragraph">Paragraph</SelectItem>
        <SelectItem value="quote">Quote</SelectItem>
        <Select.Separator />
        <SelectItem value="h1">Heading 1</SelectItem>
        <SelectItem value="h2">Heading 2</SelectItem>
        <SelectItem value="h3">Heading 3</SelectItem>
        <SelectItem value="h4">Heading 4</SelectItem>
        <SelectItem value="h5">Heading 5</SelectItem>
        <SelectItem value="h6">Heading 6</SelectItem>
        <Select.Separator />
        <SelectItem value="info">Info</SelectItem>
      </SelectContent>
    </Select.Root>
  )
}
