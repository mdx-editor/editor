import React from 'react'

import type { BaseSelection, LexicalEditor } from 'lexical'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { useLexicalNodeSelection } from '@lexical/react/useLexicalNodeSelection'
import { mergeRegister } from '@lexical/utils'
import { useCellValues } from '@mdxeditor/gurx'
import { ImageIcon } from '@radix-ui/react-icons'
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
import { MdxJsxAttribute, MdxJsxExpressionAttribute } from 'mdast-util-mdx-jsx'
import { disableImageResize$, editImageToolbarComponent$, imagePlaceholder$ as imagePlaceholderComponent$, imagePreviewHandler$ } from '.'
import styles from '../../styles/ui.module.css'
import { readOnly$ } from '../core'
import { $isImageNode } from './ImageNode'
import ImageResizer from './ImageResizer'

export interface ImageEditorProps {
  nodeKey: string
  src: string
  alt?: string
  title?: string
  width: number | 'inherit'
  height: number | 'inherit'
  rest: (MdxJsxAttribute | MdxJsxExpressionAttribute)[]
}

// https://css-tricks.com/pre-caching-image-with-react-suspense/
const imgCache = {
  __cache: {} as Record<string, boolean | Promise<void>>,
  read(src: string) {
    if (!this.__cache[src]) {
      this.__cache[src] = new Promise<void>((resolve) => {
        const img = new Image()
        img.onload = () => {
          this.__cache[src] = true
          resolve()
        }
        img.src = src
      })
    }
    if (this.__cache[src] instanceof Promise) {
      // eslint-disable-next-line @typescript-eslint/no-throw-literal, @typescript-eslint/only-throw-error
      throw this.__cache[src]
    }
    return this.__cache[src]
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
  void imgCache.read(src)
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
  const [ImagePlaceholderComponent, disableImageResize, imagePreviewHandler, readOnly, EditImageToolbar] = useCellValues(
    imagePlaceholderComponent$,
    disableImageResize$,
    imagePreviewHandler$,
    readOnly$,
    editImageToolbarComponent$
  )

  const imageRef = React.useRef<null | HTMLImageElement>(null)
  const buttonRef = React.useRef<HTMLButtonElement | null>(null)
  const [isSelected, setSelected, clearSelection] = useLexicalNodeSelection(nodeKey)
  const [editor] = useLexicalComposerContext()
  const [selection, setSelection] = React.useState<BaseSelection | null>(null)
  const activeEditorRef = React.useRef<LexicalEditor | null>(null)
  const [isResizing, setIsResizing] = React.useState<boolean>(false)
  const [imageSource, setImageSource] = React.useState<string | null>(null)
  const [initialImagePath, setInitialImagePath] = React.useState<string | null>(null)

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
    <React.Suspense fallback={ImagePlaceholderComponent ? <ImagePlaceholderComponent /> : null}>
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
          <EditImageToolbar
            nodeKey={nodeKey}
            imageSource={imageSource}
            initialImagePath={initialImagePath}
            title={title ?? ''}
            alt={alt ?? ''}
          />
        )}
      </div>
    </React.Suspense>
  ) : null
}

export function ImagePlaceholder(): JSX.Element {
  return (
    <div className={styles.imagePlaceholder}>
      <ImageIcon />
    </div>
  )
}
