import React from 'react'

import type { BaseSelection, LexicalEditor } from 'lexical'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { useLexicalNodeSelection } from '@lexical/react/useLexicalNodeSelection'
import { mergeRegister } from '@lexical/utils'
import classNames from 'classnames'
import {
  $getNodeByKey,
  $getSelection,
  $isNodeSelection,
  $setSelection,
  CLICK_COMMAND,
  COMMAND_PRIORITY_LOW,
  DRAGSTART_COMMAND,
  KEY_BACKSPACE_COMMAND,
  KEY_DELETE_COMMAND,
  KEY_ENTER_COMMAND,
  KEY_ESCAPE_COMMAND,
  SELECTION_CHANGE_COMMAND
} from 'lexical'
import { disableImageResize$, disableImageSettingsButton$, imagePreviewHandler$, openEditImageDialog$ } from '.'
import styles from '../../styles/ui.module.css'
import { iconComponentFor$, readOnly$, useTranslation } from '../core'
import { $isImageNode } from './ImageNode'
import ImageResizer from './ImageResizer'
import { useCellValues, usePublisher } from '@mdxeditor/gurx'
import { MdxJsxAttribute, MdxJsxExpressionAttribute } from 'mdast-util-mdx-jsx'

export interface ImageEditorProps {
  nodeKey: string
  src: string
  alt?: string
  title?: string
  width: number | 'inherit'
  height: number | 'inherit'
  rest: (MdxJsxAttribute | MdxJsxExpressionAttribute)[]
}

const imageCache = new Set()

function useSuspenseImage(src: string) {
  if (!imageCache.has(src)) {
    // eslint-disable-next-line @typescript-eslint/no-throw-literal, @typescript-eslint/only-throw-error
    throw new Promise((resolve) => {
      const img = new Image()
      img.src = src
      img.onerror = img.onload = () => {
        imageCache.add(src)
        resolve(null)
      }
    })
  }
}

function LazyImage({
  title,
  alt,
  className,
  imageRef,
  src,
  width,
  height
}: {
  title: string
  alt: string
  className: string | null
  imageRef: { current: null | HTMLImageElement }
  src: string
  width: number | 'inherit'
  height: number | 'inherit'
}): JSX.Element {
  useSuspenseImage(src)
  return (
    <img
      className={className ?? undefined}
      alt={alt}
      src={src}
      title={title}
      ref={imageRef}
      draggable="false"
      width={width}
      height={height}
    />
  )
}

export function ImageEditor({ src, title, alt, nodeKey, width, height, rest }: ImageEditorProps): JSX.Element | null {
  const [disableImageResize, disableImageSettingsButton, imagePreviewHandler, iconComponentFor, readOnly] = useCellValues(
    disableImageResize$,
    disableImageSettingsButton$,
    imagePreviewHandler$,
    iconComponentFor$,
    readOnly$
  )

  const openEditImageDialog = usePublisher(openEditImageDialog$)
  const imageRef = React.useRef<null | HTMLImageElement>(null)
  const buttonRef = React.useRef<HTMLButtonElement | null>(null)
  const [isSelected, setSelected, clearSelection] = useLexicalNodeSelection(nodeKey)
  const [editor] = useLexicalComposerContext()
  const [selection, setSelection] = React.useState<BaseSelection | null>(null)
  const activeEditorRef = React.useRef<LexicalEditor | null>(null)
  const [isResizing, setIsResizing] = React.useState<boolean>(false)
  const [imageSource, setImageSource] = React.useState<string | null>(null)
  const [initialImagePath, setInitialImagePath] = React.useState<string | null>(null)
  const t = useTranslation()

  const onDelete = React.useCallback(
    (payload: KeyboardEvent) => {
      if (isSelected && $isNodeSelection($getSelection())) {
        const event: KeyboardEvent = payload
        event.preventDefault()
        const node = $getNodeByKey(nodeKey)
        if ($isImageNode(node)) {
          node.remove()
        }
      }
      return false
    },
    [isSelected, nodeKey]
  )

  const onEnter = React.useCallback(
    (event: KeyboardEvent) => {
      const latestSelection = $getSelection()
      const buttonElem = buttonRef.current
      if (isSelected && $isNodeSelection(latestSelection) && latestSelection.getNodes().length === 1) {
        if (buttonElem !== null && buttonElem !== document.activeElement) {
          event.preventDefault()
          buttonElem.focus()
          return true
        }
      }
      return false
    },
    [isSelected]
  )

  const onEscape = React.useCallback(
    (event: KeyboardEvent) => {
      if (buttonRef.current === event.target) {
        $setSelection(null)
        editor.update(() => {
          setSelected(true)
          const parentRootElement = editor.getRootElement()
          if (parentRootElement !== null) {
            parentRootElement.focus()
          }
        })
        return true
      }
      return false
    },
    [editor, setSelected]
  )

  React.useEffect(() => {
    if (imagePreviewHandler) {
      const callPreviewHandler = async () => {
        if (!initialImagePath) setInitialImagePath(src)
        const updatedSrc = await imagePreviewHandler(src)
        setImageSource(updatedSrc)
      }
      callPreviewHandler().catch((e: unknown) => {
        console.error(e)
      })
    } else {
      setImageSource(src)
    }
  }, [src, imagePreviewHandler, initialImagePath])

  React.useEffect(() => {
    let isMounted = true
    const unregister = mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        if (isMounted) {
          setSelection(editorState.read(() => $getSelection()))
        }
      }),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        (_, activeEditor) => {
          activeEditorRef.current = activeEditor
          return false
        },
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand<MouseEvent>(
        CLICK_COMMAND,
        (payload) => {
          const event = payload

          if (isResizing) {
            return true
          }
          if (event.target === imageRef.current) {
            if (event.shiftKey) {
              setSelected(!isSelected)
            } else {
              clearSelection()
              setSelected(true)
            }
            return true
          }

          return false
        },
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        DRAGSTART_COMMAND,
        (event) => {
          if (event.target === imageRef.current) {
            // TODO This is just a temporary workaround for FF to behave like other browsers.
            // Ideally, this handles drag & drop too (and all browsers).
            event.preventDefault()
            return true
          }
          return false
        },
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(KEY_DELETE_COMMAND, onDelete, COMMAND_PRIORITY_LOW),
      editor.registerCommand(KEY_BACKSPACE_COMMAND, onDelete, COMMAND_PRIORITY_LOW),
      editor.registerCommand(KEY_ENTER_COMMAND, onEnter, COMMAND_PRIORITY_LOW),
      editor.registerCommand(KEY_ESCAPE_COMMAND, onEscape, COMMAND_PRIORITY_LOW)
    )
    return () => {
      isMounted = false
      unregister()
    }
  }, [clearSelection, editor, isResizing, isSelected, nodeKey, onDelete, onEnter, onEscape, setSelected])

  const onResizeEnd = (nextWidth: 'inherit' | number, nextHeight: 'inherit' | number) => {
    // Delay hiding the resize bars for click case
    setTimeout(() => {
      setIsResizing(false)
    }, 200)

    editor.update(() => {
      const node = $getNodeByKey(nodeKey)
      if ($isImageNode(node)) {
        node.setWidthAndHeight(nextWidth, nextHeight)
      }
    })
  }

  const onResizeStart = () => {
    setIsResizing(true)
  }

  const draggable = $isNodeSelection(selection)
  const isFocused = isSelected

  const passedClassName = React.useMemo(() => {
    if (rest.length === 0) {
      return null
    }
    const className = rest.find((attr) => attr.type === 'mdxJsxAttribute' && (attr.name === 'class' || attr.name === 'className'))
    if (className) {
      return className.value as string
    }
    return null
  }, [rest])

  return imageSource !== null ? (
    <React.Suspense fallback={null}>
      <div className={styles.imageWrapper} data-editor-block-type="image">
        <div draggable={draggable}>
          <LazyImage
            width={width}
            height={height}
            className={classNames(
              {
                [styles.focusedImage]: isFocused
              },
              passedClassName
            )}
            src={imageSource}
            title={title ?? ''}
            alt={alt ?? ''}
            imageRef={imageRef}
          />
        </div>
        {draggable && isFocused && !disableImageResize && (
          <ImageResizer editor={editor} imageRef={imageRef} onResizeStart={onResizeStart} onResizeEnd={onResizeEnd} />
        )}
        {readOnly || (
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
                      title: title ?? '',
                      altText: alt ?? ''
                    }
                  })
                }}
              >
                {iconComponentFor('settings')}
              </button>
            )}
          </div>
        )}
      </div>
    </React.Suspense>
  ) : null
}
