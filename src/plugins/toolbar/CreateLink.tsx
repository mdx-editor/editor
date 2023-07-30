import React from 'react'
import { Button } from './primitives/toolbar'
import LinkIcon from '../../icons/link.svg'
import { linkDialogPluginHooks } from '../link-dialog/realmPlugin'

export const Createlink = () => {
  const openLinkDialog = linkDialogPluginHooks.usePublisher('openLinkEditDialog')
  return (
    <Button onClick={(_) => openLinkDialog(true)}>
      <LinkIcon />
    </Button>
  )
}
