import * as Dialog from '@radix-ui/react-dialog'
import classNames from 'classnames'
import React from 'react'
import { useForm } from 'react-hook-form'
import styles from '../../styles/ui.module.css'
import { editorRootElementRef$, useTranslation } from '../core/index'
import { closeImageDialog$, imageAutocompleteSuggestions$, imageDialogState$, imageUploadHandler$, saveImage$ } from './index'
import { DownshiftAutoComplete } from '../core/ui/DownshiftAutoComplete'
import { useCellValues, usePublisher } from '@mdxeditor/gurx'

interface ImageFormFields {
  src: string
  title: string
  altText: string
  file: FileList
}

export const ImageDialog: React.FC = () => {
  const [imageAutocompleteSuggestions, state, editorRootElementRef, imageUploadHandler] = useCellValues(
    imageAutocompleteSuggestions$,
    imageDialogState$,
    editorRootElementRef$,
    imageUploadHandler$
  )
  const saveImage = usePublisher(saveImage$)
  const closeImageDialog = usePublisher(closeImageDialog$)
  const t = useTranslation()

  const { register, handleSubmit, control, setValue, reset } = useForm<ImageFormFields>({
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    values: state.type === 'editing' ? (state.initialValues as any) : {}
  })

  return (
    <Dialog.Root
      open={state.type !== 'inactive'}
      onOpenChange={(open) => {
        if (!open) {
          closeImageDialog()
          reset({ src: '', title: '', altText: '' })
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
            onSubmit={(e) => {
              void handleSubmit(saveImage)(e)
              reset({ src: '', title: '', altText: '' })
              e.preventDefault()
              e.stopPropagation()
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
