import React from 'react'
import * as Popover from '@radix-ui/react-popover'
import * as styles from './Popover.css'
import { themeClassName } from '../theme.css'

export function PopoverAnchor(props: React.ComponentProps<typeof Popover.Anchor>) {
  return <Popover.Anchor {...props} className={styles.Anchor} />
}

export const PopoverContent = React.forwardRef<any, React.ComponentProps<typeof Popover.Content>>(
  (props: React.ComponentProps<typeof Popover.Content>, ref) => {
    return <Popover.Content {...props} className={`${themeClassName} ${styles.Content}`} ref={ref} />
  }
)
