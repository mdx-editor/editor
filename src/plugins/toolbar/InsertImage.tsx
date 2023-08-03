import React from 'react'
import { imagePluginHooks } from '../image'
import { DialogButton } from './primitives/DialogButton'
import AddPhotoIcon from '../../icons/add_photo.svg'
import { RequirePlugin } from '../../gurx'

const InnerInsertImage = React.forwardRef<HTMLButtonElement, Record<string, never>>((_, forwardedRef) => {
  const [imageAutocompleteSuggestions] = imagePluginHooks.useEmitterValues('imageAutocompleteSuggestions')
  const insertImage = imagePluginHooks.usePublisher('insertImage')

  return (
    <DialogButton
      ref={forwardedRef}
      submitButtonTitle="Insert Image"
      dialogInputPlaceholder="Paste or select image URL"
      tooltipTitle="Insert image"
      onSubmit={insertImage}
      buttonContent={<AddPhotoIcon />}
      autocompleteSuggestions={imageAutocompleteSuggestions}
    />
  )
})

export const InsertImage = () => {
  return (
    <RequirePlugin id="image">
      <InnerInsertImage />
    </RequirePlugin>
  )
}
