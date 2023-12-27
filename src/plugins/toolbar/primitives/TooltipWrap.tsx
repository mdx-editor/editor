import * as Tooltip from '@radix-ui/react-tooltip'
import classNames from 'classnames'
import React, { ReactNode } from 'react'
import styles from '../../../styles/ui.module.css'
import { useCellValue } from '@mdxeditor/gurx'
import { editorRootElementRef$ } from '../../core'

/**
 * A styled wrapper around the radix-ui tooltip, that lets you display an instant tooltip on hover.
 * @group Toolbar Primitives
 */
export const TooltipWrap = React.forwardRef<HTMLButtonElement, { title: string; children: ReactNode }>(({ title, children }, ref) => {
  const editorRootElementRef = useCellValue(editorRootElementRef$)

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
