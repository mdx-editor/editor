import React from 'react'
import * as Popover from '@radix-ui/react-popover'

export function PopoverAnchor(props: React.ComponentProps<typeof Popover.Anchor>) {
  return <Popover.Anchor {...props} className="" />
}

export const PopoverContent = React.forwardRef<any, React.ComponentProps<typeof Popover.Content>>(
  (props: React.ComponentProps<typeof Popover.Content>, ref) => {
    return <Popover.Content {...props} className="" ref={ref} />
  }
)

export const PopoverTrigger = React.forwardRef<any, React.ComponentProps<typeof Popover.Trigger>>(
  (props: React.ComponentProps<typeof Popover.Trigger>, ref) => {
    return <Popover.Trigger {...props} className="" ref={ref} />
  }
)
