import React from 'react'
import type {
  BaseSelection,
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  EditorConfig,
  LexicalCommand,
  LexicalEditor,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
  Spread
} from 'lexical'

import {
  $createParagraphNode,
  $createRangeSelection,
  $getNodeByKey,
  $getSelection,
  $insertNodes,
  $isNodeSelection,
  $isRootOrShadowRoot,
  $setSelection,
  CLICK_COMMAND,
  COMMAND_PRIORITY_CRITICAL,
  COMMAND_PRIORITY_EDITOR,
  COMMAND_PRIORITY_HIGH,
  COMMAND_PRIORITY_LOW,
  DRAGOVER_COMMAND,
  DRAGSTART_COMMAND,
  DROP_COMMAND,
  DecoratorNode,
  KEY_BACKSPACE_COMMAND,
  KEY_DELETE_COMMAND,
  KEY_ENTER_COMMAND,
  KEY_ESCAPE_COMMAND,
  PASTE_COMMAND,
  SELECTION_CHANGE_COMMAND,
  createCommand
} from 'lexical'
import { Action, Cell, Signal, map, mapTo, useCellValues, usePublisher, withLatestFrom } from '@mdxeditor/gurx'
import { useLexicalNodeSelection } from '@lexical/react/useLexicalNodeSelection'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { activeEditor$, createActiveEditorSubscription$, iconComponentFor$, readOnly$, useTranslation } from '../core'
import { $wrapNodeInElement, mergeRegister } from '@lexical/utils'
import classNames from 'classnames'
import ImageResizer from './ImageResizer'
import styles from '../../styles/ui.module.css'
import { canDropImage, getDragImageData, getDragSelection } from './utils'

/**
 * Close the image dialog.
 * @group Image
 */
export const closeImageDialog$ = Action((r) => {
  r.link(r.pipe(closeImageDialog$, mapTo({ type: 'inactive' })), imageDialogState$)
})

export const disableImageResize$ = Cell<boolean>(false)
export const disableImageSettingsButton$ = Cell<boolean>(false)

/**
 * @group Image
 */
export type ImagePreviewHandler = ((imageSource: string) => Promise<string>) | null

/**
 * Holds the image preview handler callback.
 * @group Image
 */
export const imagePreviewHandler$ = Cell<ImagePreviewHandler>(null)

/**
 * Retruns true if the node is an {@link ImageNode}.
 * @group Image
 */
export function $isImageNode(node: LexicalNode | null | undefined): node is ImageNode {
  return node instanceof ImageNode
}

interface BaseImageParameters {
  altText?: string
  title?: string
}

/**
 * @group Image
 */
export interface SaveImageParameters extends BaseImageParameters {
  src?: string
  file: FileList
}

/** @internal */
export type InsertImagePayload = Readonly<CreateImageNodeParameters>

/**
 * The state of the image dialog when it is in editing an existing node.
 * @group Image
 */
export interface EditingImageDialogState {
  type: 'editing'
  nodeKey: string
  initialValues: Omit<SaveImageParameters, 'file'>
}

/**
 * The state of the image dialog when it is inactive.
 * @group Image
 */
export interface InactiveImageDialogState {
  type: 'inactive'
}

/**
 * The state of the image dialog when it is in new mode.
 * @group Image
 */
export interface NewImageDialogState {
  type: 'new'
}

/**
 * Saves the data from the image dialog
 * @group Image
 */
export const saveImage$ = Signal<SaveImageParameters>()

/**
 * @group Image
 */
export type ImageUploadHandler = ((image: File) => Promise<string>) | null
/**
 * @group Image
 */
export interface SrcImageParameters extends BaseImageParameters {
  src: string
}

/**
 * Opens the edit image dialog with the published parameters.
 * @group Image
 */
export const openEditImageDialog$ = Signal<Omit<EditingImageDialogState, 'type'>>((r) => {
  r.link(
    r.pipe(
      openEditImageDialog$,
      map((payload: Omit<EditingImageDialogState, 'type'>) => ({ type: 'editing' as const, ...payload }))
    ),
    imageDialogState$
  )
})

/**
 * A serialized representation of an {@link ImageNode}.
 * @group Image
 */
export type SerializedImageNode = Spread<
  {
    altText: string
    title?: string
    width?: number
    height?: number
    src: string
    type: 'image'
    version: 1
  },
  SerializedLexicalNode
>

/**
 * The parameters used to create an {@link ImageNode} through {@link $createImageNode}.
 * @group Image
 */
export interface CreateImageNodeParameters {
  altText: string
  width?: number
  height?: number
  title?: string
  key?: NodeKey
  src: string
}

/**
 * Creates an {@link ImageNode}.
 * @param params - The image attributes.
 * @group Image
 */
export function $createImageNode(params: CreateImageNodeParameters): ImageNode {
  const { altText, title, src, key, width, height } = params
  return new ImageNode(src, altText, title, width, height, key)
}

export interface ImageEditorProps {
  nodeKey: string
  src: string
  alt?: string
  title?: string
  width: number | 'inherit'
  height: number | 'inherit'
}

const imageCache = new Set()

function convertImageElement(domNode: Node): null | DOMConversionOutput {
  if (domNode instanceof HTMLImageElement) {
    const { alt: altText, src, title, width, height } = domNode
    const node = $createImageNode({ altText, src, title, width, height })
    return { node }
  }
  return null
}

function getImageNodeInSelection(): ImageNode | null {
  const selection = $getSelection()
  if (!$isNodeSelection(selection)) {
    return null
  }
  const nodes = selection.getNodes()
  const node = nodes[0]
  return $isImageNode(node) ? node : null
}

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

/**
 * Holds the image upload handler callback.
 * @group Image
 */
export const imageUploadHandler$ = Cell<ImageUploadHandler>(null)

export const internalInsertImage$ = Signal<SrcImageParameters>((r) => {
  r.sub(r.pipe(internalInsertImage$, withLatestFrom(activeEditor$)), ([values, theEditor]) => {
    theEditor?.update(() => {
      const imageNode = $createImageNode({ altText: values.altText ?? '', src: values.src, title: values.title ?? '' })
      $insertNodes([imageNode])
      if ($isRootOrShadowRoot(imageNode.getParentOrThrow())) {
        $wrapNodeInElement(imageNode, $createParagraphNode).selectEnd()
      }
    })
  })
})

/**
 * @internal
 */
export const INSERT_IMAGE_COMMAND: LexicalCommand<InsertImagePayload> = createCommand('INSERT_IMAGE_COMMAND')

const TRANSPARENT_IMAGE = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'

function onDragStart(event: DragEvent): boolean {
  const node = getImageNodeInSelection()
  if (!node) {
    return false
  }
  const dataTransfer = event.dataTransfer
  if (!dataTransfer) {
    return false
  }
  dataTransfer.setData('text/plain', '_')
  const img = document.createElement('img')
  img.src = TRANSPARENT_IMAGE
  dataTransfer.setDragImage(img, 0, 0)
  dataTransfer.setData(
    'application/x-lexical-drag',
    JSON.stringify({
      data: {
        altText: node.__altText,
        title: node.__title,
        key: node.getKey(),
        src: node.__src
      },
      type: 'image'
    })
  )

  return true
}

function onDragover(event: DragEvent): boolean {
  // test if the user is dragging a file from the explorer
  let cbPayload = Array.from(event.dataTransfer?.items ?? [])
  cbPayload = cbPayload.filter((i) => i.type.includes('image')) // Strip out the non-image bits

  if (cbPayload.length > 0) {
    event.preventDefault()
    return true
  }

  // handle moving images
  const node = getImageNodeInSelection()
  if (!node) {
    return false
  }
  if (!canDropImage(event)) {
    event.preventDefault()
  }

  return true
}

function onDrop(event: DragEvent, editor: LexicalEditor, imageUploadHandler: ImageUploadHandler): boolean {
  let cbPayload = Array.from(event.dataTransfer?.items ?? [])
  cbPayload = cbPayload.filter((i) => i.type.includes('image')) // Strip out the non-image bits

  if (cbPayload.length > 0) {
    if (imageUploadHandler !== null) {
      event.preventDefault()
      Promise.all(cbPayload.map((image) => imageUploadHandler(image.getAsFile()!)))
        .then((urls) => {
          urls.forEach((url) => {
            editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
              src: url,
              altText: ''
            })
          })
        })
        .catch((e: unknown) => {
          throw e
        })

      return true
    }
  }

  const node = getImageNodeInSelection()
  if (!node) {
    return false
  }
  const data = getDragImageData(event)

  if (!data) {
    return false
  }

  event.preventDefault()
  if (canDropImage(event)) {
    const range = getDragSelection(event)
    node.remove()
    const rangeSelection = $createRangeSelection()
    if (range !== null && range !== undefined) {
      rangeSelection.applyDOMRange(range)
    }
    $setSelection(rangeSelection)
    editor.dispatchCommand(INSERT_IMAGE_COMMAND, data)
  }
  return true
}

/**
 * Holds the current state of the image dialog.
 * @group Image
 */
export const imageDialogState$ = Cell<InactiveImageDialogState | NewImageDialogState | EditingImageDialogState>(
  { type: 'inactive' },
  (r) => {
    r.sub(
      r.pipe(saveImage$, withLatestFrom(activeEditor$, imageUploadHandler$, imageDialogState$)),
      ([values, theEditor, imageUploadHandler, dialogState]) => {
        const handler =
          dialogState.type === 'editing'
            ? (src: string) => {
                theEditor?.update(() => {
                  const { nodeKey } = dialogState
                  const imageNode = $getNodeByKey(nodeKey)! as ImageNode

                  imageNode.setTitle(values.title)
                  imageNode.setAltText(values.altText)
                  imageNode.setSrc(src)
                })
                r.pub(imageDialogState$, { type: 'inactive' })
              }
            : (src: string) => {
                r.pub(internalInsertImage$, { ...values, src })
                r.pub(imageDialogState$, { type: 'inactive' })
              }

        if (values.file.length > 0) {
          imageUploadHandler?.(values.file.item(0)!)
            .then(handler)
            .catch((e: unknown) => {
              throw e
            })
        } else if (values.src) {
          handler(values.src)
        }
      }
    )

    r.pub(createActiveEditorSubscription$, (editor) => {
      const theUploadHandler = r.getValue(imageUploadHandler$)
      return mergeRegister(
        editor.registerCommand<InsertImagePayload>(
          INSERT_IMAGE_COMMAND,
          (payload) => {
            const imageNode = $createImageNode(payload)
            $insertNodes([imageNode])
            if ($isRootOrShadowRoot(imageNode.getParentOrThrow())) {
              $wrapNodeInElement(imageNode, $createParagraphNode).selectEnd()
            }

            return true
          },
          COMMAND_PRIORITY_EDITOR
        ),
        editor.registerCommand<DragEvent>(
          DRAGSTART_COMMAND,
          (event) => {
            return onDragStart(event)
          },
          COMMAND_PRIORITY_HIGH
        ),
        editor.registerCommand<DragEvent>(
          DRAGOVER_COMMAND,
          (event) => {
            return onDragover(event)
          },
          COMMAND_PRIORITY_LOW
        ),

        editor.registerCommand<DragEvent>(
          DROP_COMMAND,
          (event) => {
            return onDrop(event, editor, r.getValue(imageUploadHandler$))
          },
          COMMAND_PRIORITY_HIGH
        ),
        ...(theUploadHandler !== null
          ? [
              editor.registerCommand(
                PASTE_COMMAND,
                (event: ClipboardEvent) => {
                  let cbPayload = Array.from(event.clipboardData?.items ?? [])
                  cbPayload = cbPayload.filter((i) => i.type.includes('image')) // Strip out the non-image bits

                  if (!cbPayload.length || cbPayload.length === 0) {
                    return false
                  } // If no image was present in the collection, bail.

                  const imageUploadHandlerValue = r.getValue(imageUploadHandler$)!

                  Promise.all(cbPayload.map((file) => imageUploadHandlerValue(file.getAsFile()!)))
                    .then((urls) => {
                      urls.forEach((url) => {
                        editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
                          src: url,
                          altText: ''
                        })
                      })
                    })
                    .catch((e: unknown) => {
                      throw e
                    })
                  return true
                },
                COMMAND_PRIORITY_CRITICAL
              )
            ]
          : [])
      )
    })
  }
)

/**
 * A lexical node that represents an image. Use {@link "$createImageNode"} to construct one.
 * @group Image
 */
export class ImageNode extends DecoratorNode<JSX.Element> {
  /** @internal */
  __src: string
  /** @internal */
  __altText: string
  /** @internal */
  __title: string | undefined
  /** @internal */
  __width: 'inherit' | number
  /** @internal */
  __height: 'inherit' | number

  /** @internal */
  static getType(): string {
    return 'image'
  }

  /** @internal */
  static clone(node: ImageNode): ImageNode {
    return new ImageNode(node.__src, node.__altText, node.__title, node.__width, node.__height, node.__key)
  }

  /** @internal */
  static importJSON(serializedNode: SerializedImageNode): ImageNode {
    const { altText, title, src, width, height } = serializedNode
    const node = $createImageNode({
      altText,
      title,
      src,
      height,
      width
    })
    return node
  }

  /** @internal */
  exportDOM(): DOMExportOutput {
    const element = document.createElement('img')
    element.setAttribute('src', this.__src)
    element.setAttribute('alt', this.__altText)
    if (this.__title) {
      element.setAttribute('title', this.__title)
    }
    if (this.__width) {
      element.setAttribute('width', this.__width.toString())
    }
    if (this.__height) {
      element.setAttribute('height', this.__height.toString())
    }
    return { element }
  }

  /** @internal */
  static importDOM(): DOMConversionMap | null {
    return {
      img: () => ({
        conversion: convertImageElement,
        priority: 0
      })
    }
  }

  /**
   * Constructs a new {@link ImageNode} with the specified image parameters.
   * Use {@link $createImageNode} to construct one.
   */
  constructor(
    src: string,
    altText: string,
    title: string | undefined,
    width?: 'inherit' | number,
    height?: 'inherit' | number,
    key?: NodeKey
  ) {
    super(key)
    this.__src = src
    this.__title = title
    this.__altText = altText
    this.__width = width ?? 'inherit'
    this.__height = height ?? 'inherit'
  }

  /** @internal */
  exportJSON(): SerializedImageNode {
    return {
      altText: this.getAltText(),
      title: this.getTitle(),
      height: this.__height === 'inherit' ? 0 : this.__height,
      width: this.__width === 'inherit' ? 0 : this.__width,
      src: this.getSrc(),
      type: 'image',
      version: 1
    }
  }

  /**
   * Sets the image dimensions
   */
  setWidthAndHeight(width: 'inherit' | number, height: 'inherit' | number): void {
    const writable = this.getWritable()
    writable.__width = width
    writable.__height = height
  }

  /** @internal */
  createDOM(config: EditorConfig): HTMLElement {
    const span = document.createElement('span')
    const theme = config.theme
    const className = theme.image
    if (className !== undefined) {
      span.className = className
    }
    return span
  }

  /** @internal */
  updateDOM(): false {
    return false
  }

  getSrc(): string {
    return this.__src
  }

  getAltText(): string {
    return this.__altText
  }

  getTitle(): string | undefined {
    return this.__title
  }

  getHeight(): 'inherit' | number {
    return this.__height
  }

  getWidth(): 'inherit' | number {
    return this.__width
  }

  setTitle(title: string | undefined): void {
    this.getWritable().__title = title
  }

  setSrc(src: string): void {
    this.getWritable().__src = src
  }

  setAltText(altText: string | undefined): void {
    this.getWritable().__altText = altText ?? ''
  }

  /** @internal */
  hasExplicitDimensions(): boolean {
    return this.__width !== 'inherit' || this.__height !== 'inherit'
  }

  /** @internal */
  decorate(_parentEditor: LexicalEditor): JSX.Element {
    return (
      <ImageEditor
        src={this.getSrc()}
        title={this.getTitle()}
        nodeKey={this.getKey()}
        width={this.__width}
        height={this.__height}
        alt={this.__altText}
      />
    )
  }
}

export function ImageEditor({ src, title, alt, nodeKey, width, height }: ImageEditorProps): JSX.Element | null {
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

  return imageSource !== null ? (
    <React.Suspense fallback={null}>
      <div className={styles.imageWrapper} data-editor-block-type="image">
        <div draggable={draggable}>
          <LazyImage
            width={width}
            height={height}
            className={classNames({
              [styles.focusedImage]: isFocused
            })}
            src={imageSource}
            title={title ?? ''}
            alt={alt ?? ''}
            imageRef={imageRef}
          />
        </div>
        {draggable && isFocused && !disableImageResize && (
          <ImageResizer editor={editor} imageRef={imageRef} onResizeStart={onResizeStart} onResizeEnd={onResizeEnd} />
        )}
        <div className={styles.editImageToolbar}>
          <button
            className={styles.iconButton}
            type="button"
            title={t('image.delete', 'Delete image')}
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
      </div>
    </React.Suspense>
  ) : null
}
