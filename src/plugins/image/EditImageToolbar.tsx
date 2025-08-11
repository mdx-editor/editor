import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { useCellValues, usePublisher } from '@mdxeditor/gurx'
import classNames from 'classnames'
import { $getNodeByKey } from 'lexical'
import React from 'react'
import { disableImageSettingsButton$, openEditImageDialog$, parseImageDimension } from '.'
import styles from '../../styles/ui.module.css'
import { iconComponentFor$, readOnly$, useTranslation } from '../core'

export interface EditImageToolbarProps {
  nodeKey: string
  imageSource: string
  initialImagePath: string | null
  title: string
  alt: string
  width?: number | 'inherit'
  height?: number | 'inherit'
}

export function EditImageToolbar(props: EditImageToolbarProps): JSX.Element {
  const { nodeKey, imageSource, initialImagePath, title, alt, width, height } = props
  const [disableImageSettingsButton, iconComponentFor, readOnly] = useCellValues(disableImageSettingsButton$, iconComponentFor$, readOnly$)
  const [editor] = useLexicalComposerContext()
  const openEditImageDialog = usePublisher(openEditImageDialog$)
  const t = useTranslation()

  return (
    <div className={styles.editImageToolbar}>
      <button
        className={styles.iconButton}
        type="button"
        title={t('imageEditor.deleteImage', 'Delete image')}
        disabled={readOnly}
        onClick={(e) => {
          e.preventDefault()
          editor.update(() => {
            $getNodeByKey(nodeKey)?.remove()
          })
        }}
      >
        {iconComponentFor('delete_small')}
      </button>
      {!disableImageSettingsButton && (
        <button
          type="button"
          className={classNames(styles.iconButton, styles.editImageButton)}
          title={t('imageEditor.editImage', 'Edit image')}
          disabled={readOnly}
          onClick={() => {
            openEditImageDialog({
              nodeKey: nodeKey,
              initialValues: {
                src: !initialImagePath ? imageSource : initialImagePath,
                title,
                altText: alt,
                width: parseImageDimension(width),
                height: parseImageDimension(height)
              }
            })
          }}
        >
          {iconComponentFor('settings')}
        </button>
      )}
    </div>
  )
}
