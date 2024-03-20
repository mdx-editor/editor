import React from 'react'
import {
  $applyNodeReplacement,
  DOMConversionMap,
  DOMExportOutput,
  DecoratorNode,
  LexicalEditor,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
  Spread
} from 'lexical'
import { MdxFlowExpression, MdxTextExpression } from 'mdast-util-mdx'

import lexicalThemeStyles from '../../styles/lexical-theme.module.css'
import styles from '../../styles/ui.module.css'

/**
 * The type of MDX expression.
 * @internal
 */
type MdxExpressionType = MdxTextExpression['type'] | MdxFlowExpression['type']

/**
 * A serialized representation of a {@link GenericHTMLNode}.
 * @group HTML
 */
export type SerializedLexicalMdxExpressionNode = Spread<
  {
    type: 'mdx-expression'
    mdastType: MdxExpressionType
    value: string
    version: 1
  },
  SerializedLexicalNode
>

/**
 * A Lexical node that represents a generic HTML element. Use {@link $createGenericHTMLNode} to construct one.
 * The generic HTML node is used as a "fallback" for HTML elements that are not explicitly supported by the editor.
 * @group HTML
 */
export class LexicalMdxExpressionNode extends DecoratorNode<JSX.Element> {
  /** @internal */
  __value: string

  /** @internal */
  __mdastType: MdxExpressionType

  /** @internal */
  static getType(): string {
    return 'mdx-expression'
  }

  /** @internal */
  static clone(node: LexicalMdxExpressionNode): LexicalMdxExpressionNode {
    return new LexicalMdxExpressionNode(node.__value, node.__mdastType, node.__key)
  }

  /**
   * Constructs a new {@link GenericHTMLNode} with the specified MDAST HTML node as the object to edit.
   */
  constructor(value: string, mdastType: MdxExpressionType, key?: NodeKey) {
    super(key)
    this.__value = value
    this.__mdastType = mdastType
  }

  getValue(): string {
    return this.__value
  }

  getMdastType(): MdxExpressionType {
    return this.__mdastType
  }

  // View

  createDOM(): HTMLElement {
    const element = document.createElement('span')
    element.classList.add(lexicalThemeStyles.mdxExpression)
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

  static importJSON(serializedNode: SerializedLexicalMdxExpressionNode): LexicalMdxExpressionNode {
    return $createLexicalMdxExpressionNode(serializedNode.value, serializedNode.mdastType)
  }

  exportJSON(): SerializedLexicalMdxExpressionNode {
    return {
      ...super.exportJSON(),
      value: this.getValue(),
      mdastType: this.getMdastType(),
      type: 'mdx-expression',
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
    return true
  }

  decorate(editor: LexicalEditor) {
    return (
      <>
        {'{'}
        <span className={styles.inputSizer} data-value={this.getValue()}>
          <input
            size={1}
            onKeyDown={(e) => {
              const value = (e.target as HTMLInputElement).value
              if ((value === '' && e.key === 'Backspace') || e.key === 'Delete') {
                e.stopPropagation()
                e.nativeEvent.stopImmediatePropagation()
                e.preventDefault()
                editor.update(() => {
                  this.selectPrevious()
                  this.remove()
                })
              }
            }}
            onChange={(e) => {
              e.target.parentElement!.dataset.value = e.target.value
              editor.update(() => {
                this.getWritable().__value = e.target.value
              })
            }}
            type="text"
            value={this.getValue()}
          />
        </span>
        {'}'}
      </>
    )
  }
}

/**
 * Creates a new {@link GenericHTMLNode} with the specified MDAST HTML node as the object to edit.
 * @group HTML
 */
export function $createLexicalMdxExpressionNode(value: string, type: MdxExpressionType): LexicalMdxExpressionNode {
  return $applyNodeReplacement(new LexicalMdxExpressionNode(value, type))
}

/**
 * Determines if the specified node is a {@link GenericHTMLNode}.
 * @group HTML
 */
export function $isLexicalMdxExpressionNode(node: LexicalNode | null | undefined): node is LexicalMdxExpressionNode {
  return node instanceof LexicalMdxExpressionNode
}
