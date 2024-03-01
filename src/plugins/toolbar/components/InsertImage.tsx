import { useI18n } from '@/i18n/I18nProvider'
import { useCellValues, usePublisher } from '@mdxeditor/gurx'
import * as RadixToolbar from '@radix-ui/react-toolbar'
import React from 'react'
import styles from '../../../styles/ui.module.css'
import { iconComponentFor$, readOnly$ } from '../../core/index'
import { openNewImageDialog$ } from '../../image'
import { TooltipWrap } from '../primitives/TooltipWrap'

/**
 * A toolbar button that allows the user to insert an image from an URL.
 * For the button to work, you need to have the `imagePlugin` plugin enabled.
 * @group Toolbar Components
 */
export const InsertImage = React.forwardRef<HTMLButtonElement, Record<string, never>>((_, forwardedRef) => {
  const i18n = useI18n()
  const openNewImageDialog = usePublisher(openNewImageDialog$)
  const [readOnly, iconComponentFor] = useCellValues(readOnly$, iconComponentFor$)

  return (
    <RadixToolbar.Button className={styles.toolbarButton} ref={forwardedRef} disabled={readOnly} onClick={() => openNewImageDialog()}>
      <TooltipWrap title={i18n.toolbar.image}> {iconComponentFor('add_photo')}</TooltipWrap>
    </RadixToolbar.Button>
  )
})
