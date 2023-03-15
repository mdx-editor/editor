import React from 'react'
import * as RadixPopover from '@radix-ui/react-popover'
import { PopoverAnchor, PopoverContent } from './primitives'

interface PopoverProps {
  selection: DOMRect | null
  children: React.ReactNode
  open: boolean
  popoverContentProps?: React.ComponentProps<typeof RadixPopover.Content>
}

export const Popover = ({ children, open, selection, popoverContentProps }: PopoverProps) => (
  <RadixPopover.Root open={open}>
    {open && (
      <PopoverAnchor
        style={{
          top: selection?.top,
          left: selection?.left,
          width: selection?.width,
          height: selection?.height,
        }}
      />
    )}
    <RadixPopover.Portal>
      <PopoverContent onOpenAutoFocus={(e) => e.preventDefault()} sideOffset={5} side="top" {...popoverContentProps}>
        {children}
      </PopoverContent>
    </RadixPopover.Portal>
  </RadixPopover.Root>
)
