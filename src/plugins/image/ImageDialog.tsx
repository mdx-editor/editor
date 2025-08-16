import * as Dialog from '@radix-ui/react-dialog'
import classNames from 'classnames'
import React from 'react'
import { useForm } from 'react-hook-form'
import styles from '../../styles/ui.module.css'
import { editorRootElementRef$, useTranslation } from '../core/index'
import {
  closeImageDialog$,
  imageAutocompleteSuggestions$,
  imageDialogState$,
  imageUploadHandler$,
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
  const [imageAutocompleteSuggestions, state, editorRootElementRef, imageUploadHandler, allowSetImageDimensions] = useCellValues(
    imageAutocompleteSuggestions$,
    imageDialogState$,
    editorRootElementRef$,
    imageUploadHandler$,
    allowSetImageDimensions$
  )
  const saveImage = usePublisher(saveImage$)
  const closeImageDialog = usePublisher(closeImageDialog$)
  const t = useTranslation()

  const { register, handleSubmit, control, setValue, reset } = useForm<ImageFormFields>({
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    values: state.type === 'editing' ? (state.initialValues as any) : {}
  })

  const resetFormState = () => {
    reset({ src: '', title: '', altText: '', width: undefined, height: undefined })
  }

  if (state.type === 'inactive') return null

  return (
    <Dialog.Root
      open={true}
      onOpenChange={(open) => {
        if (!open) {
          closeImageDialog()
          resetFormState()
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
          <form
            onSubmit={async (e) => {
              e.preventDefault()
              e.stopPropagation()
              await handleSubmit(saveImage)(e)
              resetFormState()
            }}
            className={styles.multiFieldForm}
          >
            {imageUploadHandler === null ? (
              <input type="hidden" accept="image/*" {...register('file')} />
            ) : (
              <div className={styles.formField}>
                <label htmlFor="file">{t('uploadImage.uploadInstructions', 'Upload an image from your device:')}</label>
                <input type="file" accept="image/*" {...register('file')} />
              </div>
            )}

            <div className={styles.formField}>
              <label htmlFor="src">
                {imageUploadHandler !== null
                  ? t('uploadImage.addViaUrlInstructions', 'Or add an image from an URL:')
                  : t('uploadImage.addViaUrlInstructionsNoUpload', 'Add an image from an URL:')}
              </label>
              <DownshiftAutoComplete
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
              <label htmlFor="alt">{t('uploadImage.alt', 'Alt:')}</label>
              <input type="text" {...register('altText')} className={styles.textInput} />
            </div>

            <div className={styles.formField}>
              <label htmlFor="title">{t('uploadImage.title', 'Title:')}</label>
              <input type="text" {...register('title')} className={styles.textInput} />
            </div>

            {allowSetImageDimensions && (
              <div className={styles.imageDimensionsContainer}>
                <div className={styles.formField}>
                  <label htmlFor="width">{t('uploadImage.width', 'Width:')}</label>
                  <input type="number" min={0} {...register('width')} className={styles.textInput} />
                </div>

                <div className={styles.formField}>
                  <label htmlFor="height">{t('uploadImage.height', 'Height:')}</label>
                  <input type="number" min={0} {...register('height')} className={styles.textInput} />
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-2)' }}>
              <button
                type="submit"
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
