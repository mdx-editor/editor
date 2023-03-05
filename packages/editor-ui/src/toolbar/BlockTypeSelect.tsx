import React from 'react'
import * as Select from '@radix-ui/react-select'
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from '@radix-ui/react-icons'
import * as styles from './BlockTypeSelect.css'

export type BlockType = 'paragraph' | 'code' | 'quote' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
export interface BLockTypeSelectProps {
  value: BlockType | ''
  onValueChange: (value: BlockType) => void
}

export const BlockTypeSelect = ({ value, onValueChange }: BLockTypeSelectProps) => (
  <Select.Root value={value} onValueChange={onValueChange}>
    <Select.Trigger aria-label="Block type" className={styles.SelectTrigger}>
      <Select.Value placeholder="Block type" />
      <Select.Icon className={styles.SelectIcon}>
        <ChevronDownIcon />
      </Select.Icon>
    </Select.Trigger>
    <Select.Portal>
      <Select.Content className={styles.SelectContent}>
        <Select.ScrollUpButton className={styles.SelectScrollUpButton}>
          <ChevronUpIcon />
        </Select.ScrollUpButton>
        <Select.Viewport className={styles.SelectViewport}>
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
        </Select.Viewport>
        <Select.ScrollDownButton className={styles.SelectScrollDownButton}>
          <ChevronDownIcon />
        </Select.ScrollDownButton>
      </Select.Content>
    </Select.Portal>
  </Select.Root>
)

const SelectItem = React.forwardRef<HTMLDivElement | null, { children: React.ReactNode; value: string }>(
  ({ children, ...props }, forwardedRef) => {
    return (
      <Select.Item {...props} ref={forwardedRef} className={styles.SelectItem}>
        <Select.ItemText>{children}</Select.ItemText>
        <Select.ItemIndicator className={styles.ItemIndicator}>
          <CheckIcon />
        </Select.ItemIndicator>
      </Select.Item>
    )
  }
)
