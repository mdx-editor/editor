import React from 'react'
import { imagePluginHooks } from '../../image'
import * as RadixToolbar from '@radix-ui/react-toolbar'
import AddPhotoIcon from '../../../icons/add_photo.svg'
import styles from '../../../styles/ui.module.css'
import { corePluginHooks } from '../../core/index'
import { TooltipWrap } from '../primitives/TooltipWrap'

/**
 * A toolbar button that allows the user to insert an image from an URL.
 * For the button to work, you need to have the `imagePlugin` plugin enabled.
 */
export const InsertImage = React.forwardRef<HTMLButtonElement, Record<string, never>>((_, forwardedRef) => {
  const openNewImageDialog = imagePluginHooks.usePublisher('openNewImageDialog')
  const [readOnly] = corePluginHooks.useEmitterValues('readOnly')

  return (
    <RadixToolbar.Button className={styles.toolbarButton} ref={forwardedRef} disabled={readOnly} onClick={() => openNewImageDialog(true)}>
      <TooltipWrap title="Insert image">
        <AddPhotoIcon />
      </TooltipWrap>
    </RadixToolbar.Button>
  )
})
