import React from 'react'
import * as Select from '@radix-ui/react-select'
import { ReactComponent as DropDownIcon } from '../icons/arrow_drop_down.svg'
import { ReactComponent as SelectedIcon } from '../icons/check_small.svg'
import { ChevronDownIcon, ChevronUpIcon } from '@radix-ui/react-icons'
import { AdmonitionKind } from '../../../nodes'
import { useEmitterValues, usePublisher } from '../../../system'

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
      <Select.Trigger aria-label="Block type" className="">
        <Select.Value placeholder="Block type" />
        <Select.Icon className="">
          <DropDownIcon />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal className="">
        <Select.Content className="" onCloseAutoFocus={(e) => e.preventDefault()}>
          <Select.ScrollUpButton className="">
            <ChevronUpIcon />
          </Select.ScrollUpButton>
          <Select.Viewport className="">
            <SelectItem value="paragraph">Paragraph</SelectItem>
            <SelectItem value="code">Code Block</SelectItem>
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
          </Select.Viewport>
          <Select.ScrollDownButton className="">
            <ChevronDownIcon />
          </Select.ScrollDownButton>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  )
}

const SelectItem = React.forwardRef<HTMLDivElement | null, { children: React.ReactNode; value: string }>(
  ({ children, ...props }, forwardedRef) => {
    return (
      <Select.Item {...props} ref={forwardedRef} className="">
        <Select.ItemText>{children}</Select.ItemText>
        <Select.ItemIndicator className="">
          <SelectedIcon />
        </Select.ItemIndicator>
      </Select.Item>
    )
  }
)
