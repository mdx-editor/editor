/* eslint-disable @typescript-eslint/no-deprecated */
import { ImagePlaceholder } from '@/plugins/image/ImagePlaceholder'
import { $wrapNodeInElement, mergeRegister } from '@lexical/utils'
import { JSX } from 'react'
import { Action, Cell, Signal, filter, map, mapTo, withLatestFrom } from '@mdxeditor/gurx'
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
  EditorUpdateOptions,
  LexicalCommand,
  LexicalEditor,
  PASTE_COMMAND,
  SKIP_DOM_SELECTION_TAG,
  getNearestEditorFromDOMNode,
  createCommand
} from 'lexical'
import { realmPlugin } from '../../RealmWithPlugins'
import { registerRealmCleanup } from '../../realmSession'
import { CAN_USE_DOM } from '../../utils/detectMac'
import {
  NESTED_EDITOR_UPDATED_COMMAND,
  activeEditor$,
  addComposerChild$,
  addExportVisitor$,
  addImportVisitor$,
  addLexicalNode$,
  createActiveEditorSubscription$,
  markdown$,
  readOnly$,
  setMarkdown$
} from '../core'
import { EditImageToolbar, EditImageToolbarProps } from './EditImageToolbar'
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

interface BaseImageParameters {
  altText?: string
  title?: string
  width?: number
  height?: number
}

/**
 * @group Image
 */
export interface FileImageParameters extends BaseImageParameters {
  file: File
}

/**
 * @group Image
 */
export interface SrcImageParameters extends BaseImageParameters {
  src: string
}
/**
 * @group Image
 */
export type InsertImageParameters = FileImageParameters | SrcImageParameters

/**
 * @group Image
 */
export interface SaveImageParameters extends BaseImageParameters {
  src?: string
  file?: FileList
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
 * The state of the image dialog when it is in editing an existing node.
 * @group Image
 */
export interface EditingImageDialogState {
  type: 'editing'
  nodeKey: string
  initialValues: Omit<SaveImageParameters, 'file'>
}

// Dialog focus or a slow upload can leave a table cell before an image change
// commits. Synchronize the committed change rather than relying on a second blur
// from that cell.
function syncNestedEditorOnUpdate(editor: LexicalEditor): EditorUpdateOptions {
  return {
    onUpdate: () => editor.dispatchCommand(NESTED_EDITOR_UPDATED_COMMAND, undefined),
    // Updating an inactive target must not move the user's current selection.
    tag: document.activeElement && getNearestEditorFromDOMNode(document.activeElement) === editor ? undefined : SKIP_DOM_SELECTION_TAG
  }
}

function $insertImageNode(payload: InsertImagePayload) {
  const imageNode = $createImageNode(payload)
  $insertNodes([imageNode])
  if ($isRootOrShadowRoot(imageNode.getParentOrThrow())) {
    $wrapNodeInElement(imageNode, $createParagraphNode).selectEnd()
  }
}

function insertUploadedImages(editor: LexicalEditor, urls: string[]) {
  // An editor that still has focus saves on its own blur, and synchronizing would
  // deactivate its table cell. Once focus has moved on, synchronize instead, and
  // keep the DOM selection where the user is working now.
  const options: EditorUpdateOptions | undefined =
    document.activeElement && getNearestEditorFromDOMNode(document.activeElement) === editor
      ? undefined
      : { ...syncNestedEditorOnUpdate(editor), tag: SKIP_DOM_SELECTION_TAG }
  editor.update(() => {
    urls.forEach((url) => {
      const payload: InsertImagePayload = { src: url, altText: '' }
      // INSERT_IMAGE_COMMAND is handled only in the active editor, and the user
      // may have moved to another editor while the upload was running.
      if (!editor.dispatchCommand(INSERT_IMAGE_COMMAND, payload)) {
        $insertImageNode(payload)
      }
    })
  }, options)
}

/**
 * A signal that inserts a new image node with the published payload.
 * File uploads retain the editor active at invocation and ignore stale results.
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
 * Holds the image placeholder.
 * @group Image
 */
export const imagePlaceholder$ = Cell<typeof ImagePlaceholder | null>(null)

/**
 * Upload status of the current image dialog. Dismissal ignores pending results;
 * it does not abort the consumer's upload request.
 * @group Image
 */
export const imageUploadState$ = Cell<'idle' | 'uploading' | 'error'>('idle')

/**
 * Holds the current state of the image dialog.
 * @group Image
 */
export const imageDialogState$ = Cell<InactiveImageDialogState | NewImageDialogState | EditingImageDialogState>(
  { type: 'inactive' },
  (r) => {
    // Both public and dialog uploads use the same document/editor guard. A
    // dialog request also belongs to its opening session; independent imperative
    // uploads can run concurrently without a dialog or cancelling each other.
    type DialogSession = NewImageDialogState | EditingImageDialogState
    const requests = new Set<{ dialog: DialogSession | null }>()
    let dialogRequest: object | null = null
    let dialogEditor: LexicalEditor | null = null
    let disposed = false
    registerRealmCleanup(r, () => {
      disposed = true
      requests.clear()
      dialogRequest = null
    })
    r.sub(imageDialogState$, (dialog) => {
      for (const request of requests) {
        if (request.dialog) requests.delete(request)
      }
      dialogRequest = null
      dialogEditor = dialog.type === 'inactive' ? null : r.getValue(activeEditor$)
    })
    r.link(r.pipe(imageDialogState$, mapTo('idle' as const)), imageUploadState$)
    // A parent resync must not dismiss an idle URL dialog or reset its fields.
    // Only uploads started against the previous document become stale.
    r.sub(
      r.pipe(
        setMarkdown$,
        withLatestFrom(markdown$),
        filter(([nextMarkdown, currentMarkdown]) => nextMarkdown.trim() !== currentMarkdown.trim())
      ),
      () => {
        const pendingDialogUpload = [...requests].some((request) => request.dialog !== null)
        requests.clear()
        dialogRequest = null
        if (pendingDialogUpload) r.pub(closeImageDialog$)
      }
    )
    // Link this transition into the same graph update so consumers of both
    // readOnly$ and imageDialogState$ observe a consistent snapshot.
    r.link(
      r.pipe(
        readOnly$,
        filter((readOnly) => readOnly),
        mapTo({ type: 'inactive' as const })
      ),
      imageDialogState$
    )
    r.sub(readOnly$, (readOnly) => {
      if (readOnly) requests.clear()
    })

    const startRequest = (editor: LexicalEditor | null, dialog: DialogSession | null) => {
      const rootElement = editor?.getRootElement()
      if (disposed || !editor || !rootElement?.isConnected || !editor.isEditable() || r.getValue(readOnly$)) return
      const token = { dialog }
      requests.add(token)
      return {
        token,
        isCurrent: () =>
          requests.has(token) &&
          (!dialog || r.getValue(imageDialogState$) === dialog) &&
          editor.getRootElement() === rootElement &&
          rootElement.isConnected &&
          editor.isEditable() &&
          !r.getValue(readOnly$),
        finish: () => {
          requests.delete(token)
          if (dialogRequest === token) dialogRequest = null
        }
      }
    }
    const insert = (editor: LexicalEditor, values: SrcImageParameters) => {
      editor.update(() => {
        $insertImageNode({
          ...values,
          altText: values.altText ?? '',
          width: parseImageDimension(values.width),
          height: parseImageDimension(values.height)
        })
      }, syncNestedEditorOnUpdate(editor))
    }
    r.sub(
      r.pipe(insertImage$, withLatestFrom(activeEditor$, imageUploadHandler$, imageDialogState$)),
      ([values, editor, upload, dialog]) => {
        const request = startRequest(editor, dialog.type === 'inactive' ? null : dialog)
        if (!request || !editor) return
        const save = (src: string) => {
          if (!request.isCurrent()) {
            request.finish()
            return
          }
          insert(editor, { ...values, src })
          request.finish()
        }
        if ('file' in values) {
          const fail = (error: unknown) => {
            console.error(error)
            request.finish()
          }
          if (!upload) {
            fail(new Error('No image upload handler is configured'))
            return
          }
          Promise.resolve()
            .then(() => upload(values.file))
            .then(save, fail)
        } else {
          save(values.src)
        }
      }
    )
    r.sub(
      r.pipe(saveImage$, withLatestFrom(imageUploadHandler$, imageDialogState$, allowSetImageDimensions$)),
      ([values, upload, dialog, allowDimensions]) => {
        const editor = dialogEditor
        if (dialogRequest || dialog.type === 'inactive' || !editor) return
        const request = startRequest(editor, dialog)
        if (!request) return
        dialogRequest = request.token
        const save = (src: string) => {
          if (!request.isCurrent()) {
            request.finish()
            return
          }
          if (dialog.type === 'editing') {
            editor.update(() => {
              const node = $getNodeByKey(dialog.nodeKey)
              if (!$isImageNode(node)) return
              node.setTitle(values.title)
              node.setAltText(values.altText)
              node.setSrc(src)
              if (allowDimensions) {
                node.setWidthAndHeight(parseImageDimension(values.width) ?? 'inherit', parseImageDimension(values.height) ?? 'inherit')
              }
            }, syncNestedEditorOnUpdate(editor))
          } else {
            insert(editor, { ...values, src })
          }
          request.finish()
          r.pub(closeImageDialog$)
        }
        const fail = (error: unknown) => {
          console.error(error)
          if (!request.isCurrent()) {
            request.finish()
            return
          }
          request.finish()
          r.pub(imageUploadState$, 'error')
        }
        if (values.file && values.file.length > 0) {
          if (!upload) {
            fail(new Error('No image upload handler is configured'))
            return
          }
          r.pub(imageUploadState$, 'uploading')
          Promise.resolve()
            .then(() => upload(values.file!.item(0)!))
            .then(save, fail)
        } else if (values.src) {
          save(values.src)
        } else {
          request.finish()
        }
      }
    )

    r.pub(createActiveEditorSubscription$, (editor) => {
      const theUploadHandler = r.getValue(imageUploadHandler$)
      return mergeRegister(
        editor.registerCommand<InsertImagePayload>(
          INSERT_IMAGE_COMMAND,
          (payload) => {
            $insertImageNode(payload)
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
            return onDragover(event, !!theUploadHandler)
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
        editor.registerCommand(
          PASTE_COMMAND,
          (event: ClipboardEvent) => {
            if (!theUploadHandler) {
              let fromWeb = Array.from(event.clipboardData?.items ?? [])
              fromWeb = fromWeb.filter((i) => i.type.includes('text')) // Strip out the non-image bits

              if (!fromWeb.length || fromWeb.length === 0) {
                return true
              } // If from file system, eject without calling imageUploadHandler.
              return false // If from web, bail.
            }

            const cbPayload = Array.from(event.clipboardData?.items ?? [])
            const isMixedPayload = cbPayload.some((item) => !item.type.includes('image'))
            if (isMixedPayload) return false

            if (!cbPayload.length || cbPayload.length === 0) {
              return false
            } // If no image was present in the collection, bail.

            const imageUploadHandlerValue = r.getValue(imageUploadHandler$)!

            Promise.all(cbPayload.map((file) => imageUploadHandlerValue(file.getAsFile()!)))
              .then((urls) => {
                insertUploadedImages(editor, urls)
              })
              .catch((e: unknown) => {
                throw e
              })
            return true
          },
          COMMAND_PRIORITY_CRITICAL
        )
      )
    })
  }
)

/**
 * Opens the new image dialog.
 * @group Image
 */
export const openNewImageDialog$ = Action((r) => {
  r.link(
    r.pipe(
      openNewImageDialog$,
      map(() => ({ type: 'new' as const }))
    ),
    imageDialogState$
  )
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

export const disableImageSettingsButton$ = Cell<boolean>(false)

/**
 * Allow to set width and height of image through dialog window
 * @group Image
 */

export const allowSetImageDimensions$ = Cell<boolean>(false)

/**
 * Saves the data from the image dialog
 * @group Image
 */
export const saveImage$ = Signal<SaveImageParameters>()

/**
 * Holds the custom EditImageToolbar component.
 * @group Image
 */
export const editImageToolbarComponent$ = Cell<React.FC<EditImageToolbarProps>>(EditImageToolbar)

export const parseImageDimension = (value: string | number | undefined) => {
  if (typeof value === 'undefined') return undefined
  const parsed = parseInt(String(value), 10)

  return Number.isNaN(parsed) ? undefined : parsed
}

/**
 * A plugin that adds support for images.
 * @group Image
 */
export const imagePlugin = realmPlugin<{
  imageUploadHandler?: ImageUploadHandler
  imageAutocompleteSuggestions?: string[]
  disableImageResize?: boolean
  disableImageSettingsButton?: boolean
  allowSetImageDimensions?: boolean
  imagePreviewHandler?: ImagePreviewHandler
  ImageDialog?: (() => JSX.Element) | React.FC
  EditImageToolbar?: (() => JSX.Element) | React.FC
  imagePlaceholder?: (() => JSX.Element) | null
}>({
  init(realm, params) {
    // Install lifecycle guards even when a custom dialog never reads its state.
    realm.getValue(imageDialogState$)
    realm.pubIn({
      [addImportVisitor$]: [MdastImageVisitor, MdastHtmlImageVisitor, MdastJsxImageVisitor],
      [addLexicalNode$]: ImageNode,
      [addExportVisitor$]: LexicalImageVisitor,
      [addComposerChild$]: params?.ImageDialog ?? ImageDialog,
      [imageUploadHandler$]: params?.imageUploadHandler ?? null,
      [imageAutocompleteSuggestions$]: params?.imageAutocompleteSuggestions ?? [],
      [disableImageResize$]: Boolean(params?.disableImageResize),
      [disableImageSettingsButton$]: Boolean(params?.disableImageSettingsButton),
      [allowSetImageDimensions$]: Boolean(params?.allowSetImageDimensions),
      [imagePreviewHandler$]: params?.imagePreviewHandler ?? null,
      [editImageToolbarComponent$]: params?.EditImageToolbar ?? EditImageToolbar,
      [imagePlaceholder$]: params?.imagePlaceholder ?? ImagePlaceholder
    })
  },

  update(realm, params) {
    realm.pubIn({
      [imageUploadHandler$]: params?.imageUploadHandler ?? null,
      [imageAutocompleteSuggestions$]: params?.imageAutocompleteSuggestions ?? [],
      [disableImageResize$]: Boolean(params?.disableImageResize),
      [imagePreviewHandler$]: params?.imagePreviewHandler ?? null,
      [allowSetImageDimensions$]: Boolean(params?.allowSetImageDimensions),
      [editImageToolbarComponent$]: params?.EditImageToolbar ?? EditImageToolbar,
      [imagePlaceholder$]: params?.imagePlaceholder ?? ImagePlaceholder
    })
  }
})

/** @internal */
export type InsertImagePayload = Readonly<CreateImageNodeParameters>

const getDOMSelection = (targetWindow: Window | null): Selection | null => (CAN_USE_DOM ? (targetWindow ?? window).getSelection() : null)

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

function onDragover(event: DragEvent, hasUploadHandler: boolean): boolean {
  if (hasUploadHandler) {
    // test if the user is dragging a file from the explorer
    let cbPayload = Array.from(event.dataTransfer?.items ?? [])
    cbPayload = cbPayload.filter((i) => i.type.includes('image')) // Strip out the non-image bits

    if (cbPayload.length > 0) {
      event.preventDefault()
      return true
    }
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
      Promise.all(
        cbPayload.map((image) => {
          if (image.kind === 'string') {
            return new Promise<string>((rs) => {
              image.getAsString(rs)
            })
          }
          return imageUploadHandler(image.getAsFile()!)
        })
      )
        .then((urls) => {
          insertUploadedImages(editor, urls)
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
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (document.caretRangeFromPoint) {
    range = document.caretRangeFromPoint(event.clientX, event.clientY)
  } else if (event.rangeParent && domSelection !== null) {
    domSelection.collapse(event.rangeParent, event.rangeOffset ?? 0)
    range = domSelection.getRangeAt(0)
  } else {
    throw Error(`Cannot get the selection when dragging`)
  }

  return range
}
