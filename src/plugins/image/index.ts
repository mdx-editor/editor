import { Action, Cell, Signal, map, mapTo, withLatestFrom } from '@mdxeditor/gurx'
import { LexicalCommand, createCommand } from 'lexical'
import { realmPlugin } from '../../RealmWithPlugins'
import { addComposerChild$, addExportVisitor$, addImportVisitor$, addLexicalNode$ } from '../core'
import { ImageDialog } from './ImageDialog'
import { CreateImageNodeParameters, ImageNode, imageDialogState$, internalInsertImage$ } from './ImageNode'
import { LexicalImageVisitor } from './LexicalImageVisitor'
import { MdastHtmlImageVisitor, MdastImageVisitor, MdastJsxImageVisitor } from './MdastImageVisitor'
import { imageAutocompleteSuggestions$ } from './utils'

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
  file: FileList
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

/**
 * A signal that inserts a new image node with the published payload.
 * @group Image
 */
export const insertImage$ = Signal<InsertImageParameters>((r) => {
  r.sub(r.pipe(insertImage$, withLatestFrom(imageUploadHandler$)), ([values, imageUploadHandler]) => {
    const handler = (src: string) => {
      r.pub(internalInsertImage$, { ...values, src })
    }

    if ('file' in values) {
      imageUploadHandler?.(values.file)
        .then(handler)
        .catch((e: unknown) => {
          throw e
        })
    } else {
      handler(values.src)
    }
  })
})

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

export const disableImageSettingsButton$ = Cell<boolean>(false)

/**
 * A plugin that adds support for images.
 * @group Image
 */
export const imagePlugin = realmPlugin<{
  imageUploadHandler?: ImageUploadHandler
  imageAutocompleteSuggestions?: string[]
  disableImageResize?: boolean
  disableImageSettingsButton?: boolean
  imagePreviewHandler?: ImagePreviewHandler
  ImageDialog?: (() => JSX.Element) | React.FC
}>({
  init(realm, params) {
    realm.pubIn({
      [addImportVisitor$]: [MdastImageVisitor, MdastHtmlImageVisitor, MdastJsxImageVisitor],
      [addLexicalNode$]: ImageNode,
      [addExportVisitor$]: LexicalImageVisitor,
      [addComposerChild$]: params?.ImageDialog ?? ImageDialog,
      [imageUploadHandler$]: params?.imageUploadHandler ?? null,
      [imageAutocompleteSuggestions$]: params?.imageAutocompleteSuggestions ?? [],
      [disableImageResize$]: Boolean(params?.disableImageResize),
      [disableImageSettingsButton$]: Boolean(params?.disableImageSettingsButton),
      [imagePreviewHandler$]: params?.imagePreviewHandler ?? null
    })
  },

  update(realm, params) {
    realm.pubIn({
      [imageUploadHandler$]: params?.imageUploadHandler ?? null,
      [imageAutocompleteSuggestions$]: params?.imageAutocompleteSuggestions ?? [],
      [disableImageResize$]: Boolean(params?.disableImageResize),
      [imagePreviewHandler$]: params?.imagePreviewHandler ?? null
    })
  }
})

/** @internal */
export type InsertImagePayload = Readonly<CreateImageNodeParameters>

/**
 * @internal
 */
export const INSERT_IMAGE_COMMAND: LexicalCommand<InsertImagePayload> = createCommand('INSERT_IMAGE_COMMAND')

declare global {
  interface DragEvent {
    rangeOffset?: number
    rangeParent?: Node
  }
}
