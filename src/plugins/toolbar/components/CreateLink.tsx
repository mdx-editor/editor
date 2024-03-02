import { useI18n } from '@/plugins/core/i18n'
import { useCellValue, usePublisher } from '@mdxeditor/gurx'
import React from 'react'
import { iconComponentFor$ } from '../../core'
import { openLinkEditDialog$ } from '../../link-dialog'
import { ButtonWithTooltip } from '.././primitives/toolbar'

/**
 * A toolbar component that opens the link edit dialog.
 * For this component to work, you must include the `linkDialogPlugin`.
 * @group Toolbar Components
 */
export const CreateLink = () => {
  const i18n = useI18n()
  const openLinkDialog = usePublisher(openLinkEditDialog$)
  const iconComponentFor = useCellValue(iconComponentFor$)

  return (
    <ButtonWithTooltip
      title={i18n.toolbar.link}
      onClick={(_) => {
        openLinkDialog()
      }}
    >
      {iconComponentFor('link')}
    </ButtonWithTooltip>
  )
}
