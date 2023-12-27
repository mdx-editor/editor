import {
  $applyNodeReplacement,
  DOMConversionMap,
  DOMExportOutput,
  ElementNode,
  LexicalEditor,
  LexicalNode,
  NodeKey,
  SerializedElementNode,
  Spread
} from 'lexical'
import { MdxJsxAttribute } from 'mdast-util-mdx-jsx'
import { MdxNodeType, htmlTags } from './MdastHTMLNode'

/**
 * All recognized HTML tags.
 * @group HTML
 */
export type KnownHTMLTagType = (typeof htmlTags)[number]

/** @internal */
export const TYPE_NAME = 'generic-html' as const

/**
 * A serialized representation of a {@link GenericHTMLNode}.
 * @group HTML
 */
export type SerializedGenericHTMLNode = Spread<
  {
    tag: KnownHTMLTagType
    type: 'generic-html'
    mdxType: MdxNodeType
    attributes: MdxJsxAttribute[]
    version: 1
  },
  SerializedElementNode
>

/**
 * A Lexical node that represents a generic HTML element. Use {@link $createGenericHTMLNode} to construct one.
 * The generic HTML node is used as a "fallback" for HTML elements that are not explicitly supported by the editor.
 * @group HTML
 */
export class GenericHTMLNode extends ElementNode {
  /** @internal */
  __tag: KnownHTMLTagType
  /** @internal */
  __nodeType: MdxNodeType
  /** @internal */
  __attributes: MdxJsxAttribute[]

  /** @internal */
  static getType(): string {
    return TYPE_NAME
  }

  /** @internal */
  static clone(node: GenericHTMLNode): GenericHTMLNode {
    return new GenericHTMLNode(node.__tag, node.__nodeType, node.__attributes, node.__key)
  }

  /**
   * Constructs a new {@link GenericHTMLNode} with the specified MDAST HTML node as the object to edit.
   */
  constructor(tag: KnownHTMLTagType, type: MdxNodeType, attributes: MdxJsxAttribute[], key?: NodeKey) {
    super(key)
    this.__tag = tag
    this.__nodeType = type
    this.__attributes = attributes
  }

  getTag(): KnownHTMLTagType {
    return this.__tag
  }

  getNodeType(): MdxNodeType {
    return this.__nodeType
  }

  getAttributes(): MdxJsxAttribute[] {
    return this.__attributes
  }

  updateAttributes(attributes: MdxJsxAttribute[]): void {
    const self = this.getWritable()
    self.__attributes = attributes
  }

  getStyle(): string {
    return this.__attributes.find((attribute) => attribute.name === 'style')?.value as string
  }

  // View

  createDOM(): HTMLElement {
    const tag = this.__tag
    const element = document.createElement(tag)
    // take the attributes and apply them to the element
    this.__attributes.forEach((attribute) => {
      element.setAttribute(attribute.name, attribute.value as string)
    })
    return element
  }

  updateDOM(): boolean {
    return false
  }

  static importDOM(): DOMConversionMap | null {
    // TODO: take the implementation of convertHeadingElement from headingsPlugin
    return {}
  }

  exportDOM(editor: LexicalEditor): DOMExportOutput {
    // TODO
    const { element } = super.exportDOM(editor)

    // this.getFormatType()
    /*
    if (element && isHTMLElement(element)) {
      if (this.isEmpty()) element.append(document.createElement('br'))

      const formatType = this.getFormatType()
      element.style.textAlign = formatType

      const direction = this.getDirection()
      if (direction) {
        element.dir = direction
      }
    }*/

    return {
      element
    }
  }

  static importJSON(serializedNode: SerializedGenericHTMLNode): GenericHTMLNode {
    const node = $createGenericHTMLNode(serializedNode.tag, serializedNode.mdxType, serializedNode.attributes)
    node.setFormat(serializedNode.format)
    node.setIndent(serializedNode.indent)
    node.setDirection(serializedNode.direction)
    return node
  }

  exportJSON(): SerializedGenericHTMLNode {
    return {
      ...super.exportJSON(),
      tag: this.getTag(),
      attributes: this.__attributes,
      mdxType: this.__nodeType,
      type: TYPE_NAME,
      version: 1
    }
  }

  /*
  // Mutation
  insertNewAfter(selection?: RangeSelection, restoreSelection = true): ParagraphNode | GenericHTMLNode {
    const anchorOffet = selection ? selection.anchor.offset : 0
    const newElement =
      anchorOffet > 0 && anchorOffet < this.getTextContentSize() ? $createHeadingNode(this.getTag()) : $createParagraphNode()
    const direction = this.getDirection()
    newElement.setDirection(direction)
    this.insertAfter(newElement, restoreSelection)
    return newElement
  }

  collapseAtStart(): true {
    const newElement = !this.isEmpty() ? $createHeadingNode(this.getTag()) : $createParagraphNode()
    const children = this.getChildren()
    children.forEach((child) => newElement.append(child))
    this.replace(newElement)
    return true
  }*/

  extractWithChild(): boolean {
    return true
  }

  isInline(): boolean {
    return this.__nodeType === 'mdxJsxTextElement'
  }
}

/**
 * Creates a new {@link GenericHTMLNode} with the specified MDAST HTML node as the object to edit.
 * @group HTML
 */
export function $createGenericHTMLNode(tag: KnownHTMLTagType, type: MdxNodeType, attributes: MdxJsxAttribute[]): GenericHTMLNode {
  return $applyNodeReplacement(new GenericHTMLNode(tag, type, attributes))
}

/**
 * Determines if the specified node is a {@link GenericHTMLNode}.
 * @group HTML
 */
export function $isGenericHTMLNode(node: LexicalNode | null | undefined): node is GenericHTMLNode {
  return node instanceof GenericHTMLNode
}
