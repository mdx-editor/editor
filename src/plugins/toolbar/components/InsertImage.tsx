import React from 'react'
import { imagePluginHooks } from '../../image'
import { DialogButton } from '.././primitives/DialogButton'
import AddPhotoIcon from '../../../icons/add_photo.svg'

/**
 * A toolbar button that allows the user to insert an image from an URL.
 * For the button to work, you need to have the `imagePlugin` plugin enabled.
 */
export const InsertImage = React.forwardRef<HTMLButtonElement, Record<string, never>>((_, forwardedRef) => {
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
