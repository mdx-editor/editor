import * as Dialog from '@radix-ui/react-dialog'
import classNames from 'classnames'
import React from 'react'
import { useForm } from 'react-hook-form'
import styles from '../../styles/ui.module.css'
import { editorRootElementRef$, useTranslation, readOnly$ } from '../core/index'
import {
  closeImageDialog$,
  imageAutocompleteSuggestions$,
  imageDialogState$,
  imageUploadHandler$,
  imageUploadState$,
  saveImage$,
  allowSetImageDimensions$
} from './index'
import { DownshiftAutoComplete } from '../core/ui/DownshiftAutoComplete'
import { useCellValues, usePublisher } from '@mdxeditor/gurx'

interface ImageFormFields {
  src: string
  title: string
  altText: string
  width?: number
  height?: number
  file: FileList
}

export const ImageDialog: React.FC = () => {
  const [imageAutocompleteSuggestions, state, editorRootElementRef, imageUploadHandler, allowSetImageDimensions, uploadState, readOnly] =
    useCellValues(
      imageAutocompleteSuggestions$,
      imageDialogState$,
      editorRootElementRef$,
      imageUploadHandler$,
      allowSetImageDimensions$,
      imageUploadState$,
      readOnly$
    )
  const saveImage = usePublisher(saveImage$)
  const closeImageDialog = usePublisher(closeImageDialog$)
  const t = useTranslation()
  const id = React.useId()

  const { register, handleSubmit, control, setValue, reset } = useForm<ImageFormFields>()
  React.useEffect(() => {
    reset({
      src: '',
      title: '',
      altText: '',
      width: undefined,
      height: undefined,
      file: undefined,
      ...(state.type === 'editing' ? state.initialValues : {})
    })
  }, [state, reset])

  React.useEffect(
    () => () => {
      closeImageDialog()
    },
    [closeImageDialog]
  )
  const uploading = uploadState === 'uploading'

  if (state.type === 'inactive') return null

  return (
    <Dialog.Root
      open={true}
      onOpenChange={(open) => {
        if (!open) {
          closeImageDialog()
        }
      }}
    >
      <Dialog.Portal container={editorRootElementRef?.current}>
        <Dialog.Overlay className={styles.dialogOverlay} />
        <Dialog.Content
          className={styles.dialogContent}
          onOpenAutoFocus={(e) => {
            e.preventDefault()
          }}
        >
          <Dialog.Title>{t('uploadImage.dialogTitle', 'Upload an image')}</Dialog.Title>
          <Dialog.Description className={styles.visuallyHidden}>
            {imageUploadHandler !== null
              ? t('uploadImage.dialogDescription', 'Insert an image from a URL or upload one from your device.')
              : t('uploadImage.dialogDescriptionNoUpload', 'Insert an image from a URL.')}
          </Dialog.Description>
          <form
            onSubmit={async (e) => {
              e.preventDefault()
              e.stopPropagation()
              await handleSubmit(saveImage)(e)
            }}
            aria-busy={uploading}
            className={styles.multiFieldForm}
          >
            <fieldset disabled={uploading || readOnly} style={{ border: 0, padding: 0, margin: 0 }} className={styles.multiFieldForm}>
              {imageUploadHandler === null ? (
                <input type="hidden" accept="image/*" id={`${id}-file`} {...register('file')} />
              ) : (
                <div className={styles.formField}>
                  <label htmlFor={`${id}-file`}>{t('uploadImage.uploadInstructions', 'Upload an image from your device:')}</label>
                  <input type="file" accept="image/*" id={`${id}-file`} {...register('file')} />
                </div>
              )}

              <div className={styles.formField}>
                <label htmlFor={`${id}-src`}>
                  {imageUploadHandler !== null
                    ? t('uploadImage.addViaUrlInstructions', 'Or add an image from an URL:')
                    : t('uploadImage.addViaUrlInstructionsNoUpload', 'Add an image from an URL:')}
                </label>
                <DownshiftAutoComplete
                  inputId={`${id}-src`}
                  register={register}
                  initialInputValue={state.type === 'editing' ? state.initialValues.src ?? '' : ''}
                  inputName="src"
                  suggestions={imageAutocompleteSuggestions}
                  setValue={setValue}
                  control={control}
                  placeholder={t('uploadImage.autoCompletePlaceholder', 'Select or paste an image src')}
                />
              </div>

              <div className={styles.formField}>
                <label htmlFor={`${id}-alt`}>{t('uploadImage.alt', 'Alt:')}</label>
                <input type="text" id={`${id}-alt`} {...register('altText')} className={styles.textInput} />
              </div>

              <div className={styles.formField}>
                <label htmlFor={`${id}-title`}>{t('uploadImage.title', 'Title:')}</label>
                <input type="text" id={`${id}-title`} {...register('title')} className={styles.textInput} />
              </div>

              {allowSetImageDimensions && (
                <div className={styles.imageDimensionsContainer}>
                  <div className={styles.formField}>
                    <label htmlFor={`${id}-width`}>{t('uploadImage.width', 'Width:')}</label>
                    <input type="number" min={0} id={`${id}-width`} {...register('width')} className={styles.textInput} />
                  </div>

                  <div className={styles.formField}>
                    <label htmlFor={`${id}-height`}>{t('uploadImage.height', 'Height:')}</label>
                    <input type="number" min={0} id={`${id}-height`} {...register('height')} className={styles.textInput} />
                  </div>
                </div>
              )}
            </fieldset>
            {uploading && (
              <p role="status">
                <progress aria-label={t('uploadImage.uploading', 'Uploading image…')} /> {t('uploadImage.uploading', 'Uploading image…')}
              </p>
            )}
            {uploadState === 'error' && <p role="alert">{t('uploadImage.uploadError', 'Image upload failed. Please try again.')}</p>}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-2)' }}>
              <button
                type="submit"
                disabled={uploading || readOnly}
                title={t('dialogControls.save', 'Save')}
                aria-label={t('dialogControls.save', 'Save')}
                className={classNames(styles.primaryButton)}
              >
                {t('dialogControls.save', 'Save')}
              </button>
              <Dialog.Close asChild>
                <button
                  type="reset"
                  title={t('dialogControls.cancel', 'Cancel')}
                  aria-label={t('dialogControls.cancel', 'Cancel')}
                  className={classNames(styles.secondaryButton)}
                >
                  {t('dialogControls.cancel', 'Cancel')}
                </button>
              </Dialog.Close>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
