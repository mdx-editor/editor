import React from 'react'
import * as Popover from '@radix-ui/react-popover'
import * as styles from './SimplePopover.css'

interface SimpePopperProps {
  selection: DOMRect
  children: React.ReactNode
}
export const SimplePopover = ({ children, selection }: SimpePopperProps) => (
  <Popover.Root open>
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
      <Popover.Content side="top" className={styles.PopoverContent} onOpenAutoFocus={(e) => e.preventDefault()} sideOffset={5}>
        {children}
      </Popover.Content>
    </Popover.Portal>
  </Popover.Root>
)
