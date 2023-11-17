import * as Tooltip from '@radix-ui/react-tooltip'
import classNames from 'classnames'
import React, { ReactNode } from 'react'
import styles from '../../../styles/ui.module.css'
import { corePluginHooks } from '../../core'

/**
 * A small styled wrapper around the radix-ui tooltip, that lets you display an instan tooltip on hover.
 */
export const TooltipWrap = React.forwardRef<HTMLButtonElement, { title: string; children: ReactNode }>(({ title, children }, ref) => {
  const [editorRootElementRef] = corePluginHooks.useEmitterValues('editorRootElementRef')

  return (
    <Tooltip.Provider delayDuration={100}>
      <Tooltip.Root>
        <Tooltip.Trigger ref={ref} asChild>
          <span className={styles.tooltipTrigger}>{children}</span>
        </Tooltip.Trigger>
        <Tooltip.Portal container={editorRootElementRef?.current}>
          <Tooltip.Content className={classNames(styles.tooltipContent)} sideOffset={10}>
            {title}
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  )
})
