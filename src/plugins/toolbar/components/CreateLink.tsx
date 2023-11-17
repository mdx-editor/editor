import React from 'react'
import { ButtonWithTooltip } from '.././primitives/toolbar'
import { linkDialogPluginHooks } from '../../link-dialog'

/**
 * A toolbar component that opens the link edit dialog.
 * For this component to work, you must include the `linkDialogPlugin`.
 */
export const CreateLink = () => {
  const openLinkDialog = linkDialogPluginHooks.usePublisher('openLinkEditDialog')
  const [iconComponentFor] = linkDialogPluginHooks.useEmitterValues('iconComponentFor')
  return (
    <ButtonWithTooltip
      title="Create link"
      onClick={(_) => {
        openLinkDialog(true)
      }}
    >
      {iconComponentFor('link')}
    </ButtonWithTooltip>
  )
}
