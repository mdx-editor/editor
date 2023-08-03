import React from 'react'
import { ButtonWithTooltip } from './primitives/toolbar'
import LinkIcon from '../../icons/link.svg'
import { linkDialogPluginHooks } from '../link-dialog'
import { RequirePlugin } from '../../gurx'

export const InnerCreatelink = () => {
  const openLinkDialog = linkDialogPluginHooks.usePublisher('openLinkEditDialog')
  return (
    <ButtonWithTooltip title="Create link" onClick={(_) => openLinkDialog(true)}>
      <LinkIcon />
    </ButtonWithTooltip>
  )
}

export const Createlink = () => {
  return (
    <RequirePlugin id="link-dialog">
      <InnerCreatelink />
    </RequirePlugin>
  )
}
