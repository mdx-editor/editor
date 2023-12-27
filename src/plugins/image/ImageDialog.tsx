import * as Dialog from '@radix-ui/react-dialog'
import classNames from 'classnames'
import React from 'react'
import { useForm } from 'react-hook-form'
import styles from '../../styles/ui.module.css'
import { editorRootElementRef$ } from '../core/index'
import { closeImageDialog$, imageAutocompleteSuggestions$, imageDialogState$, saveImage$ } from './index'
import { DownshiftAutoComplete } from '../core/ui/DownshiftAutoComplete'
import { useCellValues, usePublisher } from '@mdxeditor/gurx'

interface ImageFormFields {
  src: string
  title: string
  altText: string
  file: FileList
}

export const ImageDialog: React.FC = () => {
  const [imageAutocompleteSuggestions, state, editorRootElementRef] = useCellValues(
    imageAutocompleteSuggestions$,
    imageDialogState$,
    editorRootElementRef$
  )
  const saveImage = usePublisher(saveImage$)
  const closeImageDialog = usePublisher(closeImageDialog$)

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
          <form
            onSubmit={(e) => {
              void handleSubmit(saveImage)(e)
              reset({ src: '', title: '', altText: '' })
              e.preventDefault()
              e.stopPropagation()
            }}
            className={styles.multiFieldForm}
          >
            <div className={styles.formField}>
              <label htmlFor="file">Upload an image from your device:</label>
              <input type="file" {...register('file')} />
            </div>

            <div className={styles.formField}>
              <label htmlFor="src">Or add an image from an URL:</label>
              <DownshiftAutoComplete
                register={register}
                initialInputValue={state.type === 'editing' ? state.initialValues.src || '' : ''}
                inputName="src"
                suggestions={imageAutocompleteSuggestions}
                setValue={setValue}
                control={control}
                placeholder="Select or paste an image src"
              />
            </div>

            <div className={styles.formField}>
              <label htmlFor="alt">Alt:</label>
              <input type="text" {...register('altText')} className={styles.textInput} />
            </div>

            <div className={styles.formField}>
              <label htmlFor="title">Title:</label>
              <input type="text" {...register('title')} className={styles.textInput} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-2)' }}>
              <button type="submit" title="Save" aria-label="Save" className={classNames(styles.primaryButton)}>
                Save
              </button>
              <Dialog.Close asChild>
                <button type="reset" title="Cancel" aria-label="Cancel" className={classNames(styles.secondaryButton)}>
                  Cancel
                </button>
              </Dialog.Close>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
