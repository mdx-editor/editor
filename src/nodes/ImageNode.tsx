import React from 'react'
import type {
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  EditorConfig,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
  Spread
} from 'lexical'

import { DecoratorNode } from 'lexical'

function convertImageElement(domNode: Node): null | DOMConversionOutput {
  if (domNode instanceof HTMLImageElement) {
    const { alt: altText, src, title } = domNode
    const node = $createImageNode({ altText, src, title })
    return { node }
  }
  return null
}

/**
 * A serialized representation of an {@link ImageNode}.
 */
export type SerializedImageNode = Spread<
  {
    altText: string
    title?: string
    src: string
    type: 'image'
    version: 1
  },
  SerializedLexicalNode
>

/**
 * A lexical node that represents an image. Use {@link "$createImageNode"} to construct one.
 */
export class ImageNode extends DecoratorNode<JSX.Element> {
  __src: string
  __altText: string
  __title: string | undefined

  static getType(): string {
    return 'image'
  }

  static clone(node: ImageNode): ImageNode {
    return new ImageNode(node.__src, node.__altText, node.__title, node.__key)
  }

  static importJSON(serializedNode: SerializedImageNode): ImageNode {
    const { altText, title, src } = serializedNode
    const node = $createImageNode({
      altText,
      title,
      src
    })
    return node
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('img')
    element.setAttribute('src', this.__src)
    element.setAttribute('alt', this.__altText)
    if (this.__title) {
      element.setAttribute('title', this.__title)
    }
    return { element }
  }

  static importDOM(): DOMConversionMap | null {
    return {
      img: () => ({
        conversion: convertImageElement,
        priority: 0
      })
    }
  }

  constructor(src: string, altText: string, title: string | undefined, key?: NodeKey) {
    super(key)
    this.__src = src
    this.__title = title
    this.__altText = altText
  }

  exportJSON(): SerializedImageNode {
    return {
      altText: this.getAltText(),
      title: this.getTitle(),
      src: this.getSrc(),
      type: 'image',
      version: 1
    }
  }

  createDOM(config: EditorConfig): HTMLElement {
    const span = document.createElement('span')
    const theme = config.theme
    const className = theme.image
    if (className !== undefined) {
      span.className = className
    }
    return span
  }

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

  setTitle(title: string | undefined): void {
    this.getWritable().__title = title
  }

  decorate(): JSX.Element {
    return <img title={this.__title} src={this.__src} alt={this.__altText} />
  }
}

/**
 * The payload to create an {@link ImageNode}.
 */
export interface CreateImageNodeOptions {
  altText: string
  title?: string
  key?: NodeKey
  src: string
}

/**
 * Creates an {@link ImageNode}.
 * @param options - The payload to create an image. The keys map to the img tag attributes.
 */
export function $createImageNode(options: CreateImageNodeOptions): ImageNode {
  const { altText, title, src, key } = options
  return new ImageNode(src, altText, title, key)
}

/**
 * Retruns true if the node is an {@link ImageNode}.
 */
export function $isImageNode(node: LexicalNode | null | undefined): node is ImageNode {
  return node instanceof ImageNode
}
