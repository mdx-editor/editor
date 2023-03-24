import React from 'react'
import * as Popover from '@radix-ui/react-popover'
import * as styles from './styles.css'
import { themeClassName } from '../theme.css'

export function PopoverAnchor(props: React.ComponentProps<typeof Popover.Anchor>) {
  return <Popover.Anchor {...props} className={styles.Anchor} />
}

export const PopoverContent = React.forwardRef<any, React.ComponentProps<typeof Popover.Content>>(
  (props: React.ComponentProps<typeof Popover.Content>, ref) => {
    return <Popover.Content {...props} className={`${themeClassName} ${styles.Content}`} ref={ref} />
  }
)

export const PopoverTrigger = React.forwardRef<any, React.ComponentProps<typeof Popover.Trigger>>(
  (props: React.ComponentProps<typeof Popover.Trigger>, ref) => {
    return <Popover.Trigger {...props} className={styles.Trigger} ref={ref} />
  }
)
