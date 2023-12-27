import React from 'react'
import { openNewImageDialog$ } from '../../image'
import * as RadixToolbar from '@radix-ui/react-toolbar'
import styles from '../../../styles/ui.module.css'
import { iconComponentFor$, readOnly$ } from '../../core/index'
import { TooltipWrap } from '../primitives/TooltipWrap'
import { useCellValues, usePublisher } from '@mdxeditor/gurx'

/**
 * A toolbar button that allows the user to insert an image from an URL.
 * For the button to work, you need to have the `imagePlugin` plugin enabled.
 * @group Toolbar Components
 */
export const InsertImage = React.forwardRef<HTMLButtonElement, Record<string, never>>((_, forwardedRef) => {
  const openNewImageDialog = usePublisher(openNewImageDialog$)
  const [readOnly, iconComponentFor] = useCellValues(readOnly$, iconComponentFor$)

  return (
    <RadixToolbar.Button className={styles.toolbarButton} ref={forwardedRef} disabled={readOnly} onClick={() => openNewImageDialog()}>
      <TooltipWrap title="Insert image">{iconComponentFor('add_photo')}</TooltipWrap>
    </RadixToolbar.Button>
  )
})
