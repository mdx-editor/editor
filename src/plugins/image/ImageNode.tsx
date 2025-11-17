import React from 'react'
import type {
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  EditorConfig,
  LexicalEditor,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
  Spread
} from 'lexical'

import { DecoratorNode } from 'lexical'
import { ImageEditor } from './ImageEditor'
import { MdxJsxAttribute, MdxJsxExpressionAttribute } from 'mdast-util-mdx-jsx'

function convertImageElement(domNode: Node): null | DOMConversionOutput {
  if (domNode instanceof HTMLImageElement) {
    const { alt: altText, src, title, width, height } = domNode
    const node = $createImageNode({ altText, src, title, width, height })
    return { node }
  }
  return null
}

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
    rest: (MdxJsxAttribute | MdxJsxExpressionAttribute)[]
    type: 'image'
    version: 1
  },
  SerializedLexicalNode
>

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
  __rest: (MdxJsxAttribute | MdxJsxExpressionAttribute)[]

  /** @internal */
  static getType(): string {
    return 'image'
  }

  /** @internal */
  static clone(node: ImageNode): ImageNode {
    return new ImageNode(node.__src, node.__altText, node.__title, node.__width, node.__height, node.__rest, node.__key)
  }

  /** @internal */
  static importJSON(serializedNode: SerializedImageNode): ImageNode {
    const { altText, title, src, width, rest, height } = serializedNode
    const node = $createImageNode({
      altText,
      title,
      src,
      height,
      width,
      rest
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
    rest?: (MdxJsxAttribute | MdxJsxExpressionAttribute)[],
    key?: NodeKey
  ) {
    super(key)
    this.__src = src
    this.__title = title
    this.__altText = altText
    this.__width = width ? width : 'inherit'
    this.__height = height ? height : 'inherit'
    this.__rest = rest ?? []
  }

  /** @internal */
  exportJSON(): SerializedImageNode {
    return {
      altText: this.getAltText(),
      title: this.getTitle(),
      height: this.__height === 'inherit' ? 0 : this.__height,
      width: this.__width === 'inherit' ? 0 : this.__width,
      src: this.getSrc(),
      rest: this.__rest,
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

  getRest(): (MdxJsxAttribute | MdxJsxExpressionAttribute)[] {
    return this.__rest
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
  shouldBeSerializedAsElement(): boolean {
    return this.__width !== 'inherit' || this.__height !== 'inherit' || this.__rest.length > 0
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
        rest={this.__rest}
      />
    )
  }
}

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
  rest?: (MdxJsxAttribute | MdxJsxExpressionAttribute)[]
  src: string
}

/**
 * Creates an {@link ImageNode}.
 * @param params - The image attributes.
 * @group Image
 */
export function $createImageNode(params: CreateImageNodeParameters): ImageNode {
  const { altText, title, src, key, width, height, rest } = params
  return new ImageNode(src, altText, title, width, height, rest, key)
}

/**
 * Returns true if the node is an {@link ImageNode}.
 * @group Image
 */
export function $isImageNode(node: LexicalNode | null | undefined): node is ImageNode {
  return node instanceof ImageNode
}
