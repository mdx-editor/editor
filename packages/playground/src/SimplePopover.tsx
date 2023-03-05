import React from 'react'
import * as Popover from '@radix-ui/react-popover'
import * as styles from './SimplePopover.css'

interface SimpePopperProps {
  selection: DOMRect | null
  children: React.ReactNode
  open: boolean
}
export const SimplePopover = ({ children, open, selection }: SimpePopperProps) => (
  <Popover.Root open={open}>
    <Popover.Anchor
      style={{
        position: 'absolute',
        top: selection?.top,
        left: selection?.left,
        width: selection?.width,
        height: selection?.height,
        visibility: 'hidden',
      }}
    ></Popover.Anchor>
    <Popover.Portal>
      <Popover.Content
        side="top"
        className={styles.PopoverContent}
        onOpenAutoFocus={(e) => e.preventDefault()}
        sideOffset={5}
        style={{ display: open ? '' : 'none' }}
      >
        {children}
      </Popover.Content>
    </Popover.Portal>
  </Popover.Root>
)
