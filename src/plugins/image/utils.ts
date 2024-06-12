import { Cell, Signal } from '@mdxeditor/gurx'
import { NodeKey } from 'lexical'
import { CAN_USE_DOM } from '@lexical/utils'

export const disableImageSettingsButton$ = Cell<boolean>(false)

export const disableImageResize$ = Cell<boolean>(false)

export interface CreateImageNodeParameters {
  altText: string
  width?: number
  height?: number
  title?: string
  key?: NodeKey
  src: string
}

/**
 * Holds the autocomplete suggestions for image sources.
 * @group Image
 */
export const imageAutocompleteSuggestions$ = Cell<string[]>([])

/**
 * @group Image
 */
export type ImagePreviewHandler = ((imageSource: string) => Promise<string>) | null

/**
 * Holds the image preview handler callback.
 * @group Image
 */
export const imagePreviewHandler$ = Cell<ImagePreviewHandler>(null)

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

/**
 * Saves the data from the image dialog
 * @group Image
 */
export const saveImage$ = Signal<SaveImageParameters>()

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
 * Holds the image upload handler callback.
 * @group Image
 */
export const imageUploadHandler$ = Cell<ImageUploadHandler>(null)

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

/** @internal */
export type InsertImagePayload = Readonly<CreateImageNodeParameters>

export function canDropImage(event: DragEvent): boolean {
  const target = event.target
  return !!(target && target instanceof HTMLElement && target.parentElement)
}

export function getDragImageData(event: DragEvent): null | InsertImagePayload {
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

const getDOMSelection = (targetWindow: Window | null): Selection | null => (CAN_USE_DOM ? (targetWindow ?? window).getSelection() : null)

export function getDragSelection(event: DragEvent): Range | null | undefined {
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
