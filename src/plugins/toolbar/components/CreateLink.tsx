import React from 'react'
import { ButtonWithTooltip } from '.././primitives/toolbar'
import { openLinkEditDialog$ } from '../../link-dialog'
import { useCellValue, usePublisher } from '@mdxeditor/gurx'
import { iconComponentFor$, useTranslation } from '../../core'

/**
 * A toolbar component that opens the link edit dialog.
 * For this component to work, you must include the `linkDialogPlugin`.
 * @group Toolbar Components
 */
export const CreateLink = () => {
  const openLinkDialog = usePublisher(openLinkEditDialog$)
  const iconComponentFor = useCellValue(iconComponentFor$)
  const t = useTranslation()
  return (
    <ButtonWithTooltip
      title={t('toolbar.link', 'Create link')}
      onClick={(_) => {
        openLinkDialog()
      }}
    >
      {iconComponentFor('link')}
    </ButtonWithTooltip>
  )
}
