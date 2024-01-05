import { realmPlugin } from '../../RealmWithPlugins'
import { $wrapNodeInElement } from '@lexical/utils'
import { Action, Cell, Signal, map, mapTo, withLatestFrom } from '@mdxeditor/gurx'
import {
  $createParagraphNode,
  $createRangeSelection,
  $getNodeByKey,
  $getSelection,
  $insertNodes,
  $isNodeSelection,
  $isRootOrShadowRoot,
  $setSelection,
  COMMAND_PRIORITY_CRITICAL,
  COMMAND_PRIORITY_EDITOR,
  COMMAND_PRIORITY_HIGH,
  COMMAND_PRIORITY_LOW,
  DRAGOVER_COMMAND,
  DRAGSTART_COMMAND,
  DROP_COMMAND,
  LexicalCommand,
  LexicalEditor,
  PASTE_COMMAND,
  createCommand
} from 'lexical'
import { CAN_USE_DOM } from '../../utils/detectMac'
import { addComposerChild$, addExportVisitor$, addImportVisitor$, addLexicalNode$, rootEditor$ } from '../core'
import { ImageDialog } from './ImageDialog'
import { $createImageNode, $isImageNode, CreateImageNodeParameters, ImageNode } from './ImageNode'
import { LexicalImageVisitor } from './LexicalImageVisitor'
import { MdastHtmlImageVisitor, MdastImageVisitor, MdastJsxImageVisitor } from './MdastImageVisitor'

export * from './ImageNode'

/**
 * @group Image
 */
export type ImageUploadHandler = ((image: File) => Promise<string>) | null

/**
 * @group Image
 */
export type ImagePreviewHandler = ((imageSource: string) => Promise<string>) | null

/**
 * @group Image
 */
export interface InsertImageParameters {
  src?: string
  altText?: string
  title?: string
  file: FileList
}

/**
 * The state of the image dialog when it is inactive.
 * @group Image
 */
export type InactiveImageDialogState = {
  type: 'inactive'
}

/**
 * The state of the image dialog when it is in new mode.
 * @group Image
 */
export type NewImageDialogState = {
  type: 'new'
}

/**
 * The state of the image dialog when it is in editing an existing node.
 * @group Image
 */
export type EditingImageDialogState = {
  type: 'editing'
  nodeKey: string
  initialValues: Omit<InsertImageParameters, 'file'>
}

/**
 * A signal that inserts a new image node with the published payload.
 * @group Image
 */
export const insertImage$ = Signal<InsertImageParameters>()
/**
 * Holds the autocomplete suggestions for image sources.
 * @group Image
 */
export const imageAutocompleteSuggestions$ = Cell<string[]>([])

/**
 * Holds the disable image resize configuration flag.
 * @group Image
 */
export const disableImageResize$ = Cell<boolean>(false)

/**
 * Holds the image upload handler callback.
 * @group Image
 */
export const imageUploadHandler$ = Cell<ImageUploadHandler>(null)

/**
 * Holds the image preview handler callback.
 * @group Image
 */
export const imagePreviewHandler$ = Cell<ImagePreviewHandler>(null)

/**
 * Holds the current state of the image dialog.
 * @group Image
 */
export const imageDialogState$ = Cell<InactiveImageDialogState | NewImageDialogState | EditingImageDialogState>(
  { type: 'inactive' },
  (r) => {
    r.sub(
      r.pipe(saveImage$, withLatestFrom(rootEditor$, imageUploadHandler$, imageDialogState$)),
      ([values, theEditor, imageUploadHandler, dialogState]) => {
        const handler =
          dialogState.type === 'editing'
            ? (src: string) => {
                theEditor?.update(() => {
                  const { nodeKey } = dialogState
                  const imageNode = $getNodeByKey(nodeKey) as ImageNode

                  imageNode.setTitle(values.title)
                  imageNode.setAltText(values.altText)
                  imageNode.setSrc(src)
                })
                r.pub(imageDialogState$, { type: 'inactive' })
              }
            : (src: string) => {
                theEditor?.update(() => {
                  const imageNode = $createImageNode({ altText: values.altText ?? '', src, title: values.title ?? '' })
                  $insertNodes([imageNode])
                  if ($isRootOrShadowRoot(imageNode.getParentOrThrow())) {
                    $wrapNodeInElement(imageNode, $createParagraphNode).selectEnd()
                  }
                })
                r.pub(imageDialogState$, { type: 'inactive' })
              }

        if (values.file.length > 0) {
          imageUploadHandler?.(values.file.item(0)!)
            .then(handler)
            .catch((e) => {
              throw e
            })
        } else if (values.src) {
          handler(values.src)
        }
      }
    )

    r.sub(rootEditor$, (editor) => {
      editor?.registerCommand<InsertImagePayload>(
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
      )

      const theUploadHandler = r.getValue(imageUploadHandler$)

      editor?.registerCommand<DragEvent>(
        DRAGSTART_COMMAND,
        (event) => {
          return onDragStart(event)
        },
        COMMAND_PRIORITY_HIGH
      )
      editor?.registerCommand<DragEvent>(
        DRAGOVER_COMMAND,
        (event) => {
          return onDragover(event)
        },
        COMMAND_PRIORITY_LOW
      )

      editor?.registerCommand<DragEvent>(
        DROP_COMMAND,
        (event) => {
          return onDrop(event, editor, r.getValue(imageUploadHandler$))
        },
        COMMAND_PRIORITY_HIGH
      )

      if (theUploadHandler === null) {
        return
      }

      editor?.registerCommand(
        PASTE_COMMAND,
        (event: ClipboardEvent) => {
          let cbPayload = Array.from(event.clipboardData?.items || [])
          cbPayload = cbPayload.filter((i) => /image/.test(i.type)) // Strip out the non-image bits

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
            .catch((e) => {
              throw e
            })
          return true
        },
        COMMAND_PRIORITY_CRITICAL
      )
    })
  }
)

/**
 * Opens the new image dialog.
 * @group Image
 */
export const openNewImageDialog$ = Action((r) => {
  r.link(r.pipe(openNewImageDialog$, mapTo({ type: 'new' })), imageDialogState$)
})

/**
 * Opens the edit image dialog with the published parameters.
 * @group Image
 */
export const openEditImageDialog$ = Signal<Omit<EditingImageDialogState, 'type'>>((r) => {
  r.link(
    r.pipe(
      openEditImageDialog$,
      map((payload) => ({ type: 'editing' as const, ...payload }))
    ),
    imageDialogState$
  )
})

/**
 * Close the image dialog.
 * @group Image
 */
export const closeImageDialog$ = Action((r) => {
  r.link(r.pipe(closeImageDialog$, mapTo({ type: 'inactive' })), imageDialogState$)
})

/**
 * Saves the data from the image dialog
 * @group Image
 */
export const saveImage$ = Signal<InsertImageParameters>()

/**
 * A plugin that adds support for images.
 * @group Image
 */
export const imagePlugin = realmPlugin<{
  imageUploadHandler?: ImageUploadHandler
  imageAutocompleteSuggestions?: string[]
  disableImageResize?: boolean
  imagePreviewHandler?: ImagePreviewHandler
  ImageDialog?: (() => JSX.Element) | React.FC
}>({
  init(realm, params) {
    realm.pubIn({
      [addImportVisitor$]: [MdastImageVisitor, MdastHtmlImageVisitor, MdastJsxImageVisitor],
      [addLexicalNode$]: ImageNode,
      [addExportVisitor$]: LexicalImageVisitor,
      [addComposerChild$]: params?.ImageDialog || ImageDialog
    })
  },

  update(realm, params) {
    realm.pubIn({
      [imageUploadHandler$]: params?.imageUploadHandler || null,
      [imageAutocompleteSuggestions$]: params?.imageAutocompleteSuggestions || [],
      [disableImageResize$]: Boolean(params?.disableImageResize),
      [imagePreviewHandler$]: params?.imagePreviewHandler || null
    })
  }
})

/** @internal */
export type InsertImagePayload = Readonly<CreateImageNodeParameters>

const getDOMSelection = (targetWindow: Window | null): Selection | null => (CAN_USE_DOM ? (targetWindow || window).getSelection() : null)

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
  let cbPayload = Array.from(event.dataTransfer?.items || [])
  cbPayload = cbPayload.filter((i) => /image/.test(i.type)) // Strip out the non-image bits

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
  let cbPayload = Array.from(event.dataTransfer?.items || [])
  cbPayload = cbPayload.filter((i) => /image/.test(i.type)) // Strip out the non-image bits

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
        .catch((e) => {
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

function getImageNodeInSelection(): ImageNode | null {
  const selection = $getSelection()
  if (!$isNodeSelection(selection)) {
    return null
  }
  const nodes = selection.getNodes()
  const node = nodes[0]
  return $isImageNode(node) ? node : null
}

function getDragImageData(event: DragEvent): null | InsertImagePayload {
  const dragData = event.dataTransfer?.getData('application/x-lexical-drag')
  if (!dragData) {
    return null
  }
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const { type, data } = JSON.parse(dragData)
  if (type !== 'image') {
    return null
  }

  return data
}

declare global {
  interface DragEvent {
    rangeOffset?: number
    rangeParent?: Node
  }
}

function canDropImage(event: DragEvent): boolean {
  const target = event.target
  return !!(target && target instanceof HTMLElement && target.parentElement)
}

function getDragSelection(event: DragEvent): Range | null | undefined {
  let range
  const target = event.target as null | Element | Document
  const targetWindow =
    target == null ? null : target.nodeType === 9 ? (target as Document).defaultView : (target as Element).ownerDocument.defaultView
  const domSelection = getDOMSelection(targetWindow)
  if (document.caretRangeFromPoint) {
    range = document.caretRangeFromPoint(event.clientX, event.clientY)
  } else if (event.rangeParent && domSelection !== null) {
    domSelection.collapse(event.rangeParent, event.rangeOffset || 0)
    range = domSelection.getRangeAt(0)
  } else {
    throw Error(`Cannot get the selection when dragging`)
  }

  return range
}
