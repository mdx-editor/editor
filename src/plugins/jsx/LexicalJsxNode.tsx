import React from 'react'
import type { LexicalEditor, LexicalNode, NodeKey, SerializedLexicalNode, Spread } from 'lexical'

import { DecoratorNode } from 'lexical'
import { JsxEditorContainer } from './JsxEditorContainer'
import { MdastJsx } from '../../types/JsxComponentDescriptors'

/**
 * A serialized representation of an {@link LexicalJsxNode}.
 */
export type SerializedLexicalJsxNode = Spread<
  {
    mdastNode: MdastJsx
    type: 'jsx'
    version: 1
  },
  SerializedLexicalNode
>

/**
 * A lexical node that represents an image. Use {@link "$createLexicalJsxNode"} to construct one.
 */
export class LexicalJsxNode extends DecoratorNode<JSX.Element> {
  __mdastNode: MdastJsx

  static getType(): string {
    return 'jsx'
  }

  static clone(node: LexicalJsxNode): LexicalJsxNode {
    return new LexicalJsxNode(structuredClone(node.__mdastNode))
  }

  static importJSON(serializedNode: SerializedLexicalJsxNode): LexicalJsxNode {
    return $createLexicalJsxNode(serializedNode.mdastNode)
  }

  constructor(mdastNode: MdastJsx, key?: NodeKey) {
    super(key)
    this.__mdastNode = mdastNode
  }

  getMdastNode(): MdastJsx {
    return this.__mdastNode
  }

  exportJSON(): SerializedLexicalJsxNode {
    return {
      mdastNode: this.getMdastNode(),
      type: 'jsx',
      version: 1
    }
  }

  createDOM(): HTMLElement {
    return document.createElement(this.__mdastNode.type === 'mdxJsxTextElement' ? 'span' : 'div')
  }

  updateDOM(): false {
    return false
  }

  setMdastNode(mdastNode: MdastJsx): void {
    this.getWritable().__mdastNode = mdastNode
  }

  decorate(parentEditor: LexicalEditor): JSX.Element {
    return <JsxEditorContainer lexicalJsxNode={this} mdastNode={this.getMdastNode()} parentEditor={parentEditor} />
  }

  isInline(): boolean {
    return false
  }

  isKeyboardSelectable(): boolean {
    return true
  }
}

/**
 * Creates an {@link LexicalJsxNode}.
 */
export function $createLexicalJsxNode(mdastNode: MdastJsx): LexicalJsxNode {
  return new LexicalJsxNode(mdastNode)
}

/**
 * Retruns true if the node is an {@link LexicalJsxNode}.
 */
export function $isLexicalJsxNode(node: LexicalNode | null | undefined): node is LexicalJsxNode {
  return node instanceof LexicalJsxNode
}
