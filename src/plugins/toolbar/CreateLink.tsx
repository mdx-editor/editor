import React from 'react'
import { ButtonWithTooltip } from './primitives/toolbar'
import LinkIcon from '../../icons/link.svg'
import { linkDialogPluginHooks } from '../link-dialog/realmPlugin'

export const Createlink = () => {
  const openLinkDialog = linkDialogPluginHooks.usePublisher('openLinkEditDialog')
  return (
    <ButtonWithTooltip title="Create link" onClick={(_) => openLinkDialog(true)}>
      <LinkIcon />
    </ButtonWithTooltip>
  )
}
