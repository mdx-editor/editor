import React, { useRef, useState, useCallback } from 'react'
import { BlockTypeSelect, BoldItalicUnderlineToggles, CreateLink, linkDialogPlugin, MDXEditor } from '../'
import { headingsPlugin, toolbarPlugin } from '../'

export function WithinDialog() {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [overlayContainer, setOverlayContainer] = useState<HTMLDialogElement | null>(null)
  const showDialog = useCallback(() => {
    dialogRef.current?.showModal()
    setOverlayContainer(dialogRef.current ?? null)
  }, [dialogRef])

  const closeDialog = useCallback(() => {
    dialogRef.current?.close()
  }, [dialogRef])

  return (
    <>
      <button onClick={showDialog}>Show dialog</button>
      <dialog ref={dialogRef}>
        <button onClick={closeDialog}>Close dialog</button>
        {dialogRef.current && (
          <MDXEditor
            overlayContainer={overlayContainer}
            markdown="# Hello Dialog"
            plugins={[
              headingsPlugin(),
              linkDialogPlugin(),
              toolbarPlugin({
                toolbarContents: () => (
                  <>
                    <BoldItalicUnderlineToggles />
                    <BlockTypeSelect />
                    <CreateLink />
                  </>
                )
              })
            ]}
          />
        )}
      </dialog>
    </>
  )
}
