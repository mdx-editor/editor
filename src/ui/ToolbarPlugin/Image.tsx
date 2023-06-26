import * as RadixToolbar from '@radix-ui/react-toolbar'
import React from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import styles from '../styles.module.css'

export const ImageButton = React.forwardRef<HTMLButtonElement, RadixToolbar.ToolbarButtonProps>((props, forwardedRef) => {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <RadixToolbar.Button className={styles.toolbarButton} {...props} ref={forwardedRef}>
          M
        </RadixToolbar.Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="DialogOverlay" />
        <Dialog.Content className="DialogContent">
          <Dialog.Title className="DialogTitle">Insert Image</Dialog.Title>
          Content
          <Dialog.Close asChild>
            <button className="Button green">Cancel</button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
})
