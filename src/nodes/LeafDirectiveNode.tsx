import React from 'react'
import type { LexicalEditor, LexicalNode, NodeKey, SerializedLexicalNode, Spread } from 'lexical'

import { DecoratorNode } from 'lexical'
import { ExtendedEditorConfig } from '../types/ExtendedEditorConfig'
import { LeafDirective } from 'mdast-util-directive'

/**
 * A serialized representation of an {@link LeafDirectiveNode}.
 */
export type SerializedLeafDirectiveNode = Spread<
  {
    mdastNode: LeafDirective
    type: 'leafDirective'
    version: 1
  },
  SerializedLexicalNode
>

/**
 * A lexical node that represents an image. Use {@link "$createLeafDirectiveNode"} to construct one.
 */
export class LeafDirectiveNode extends DecoratorNode<JSX.Element> {
  __mdastNode: LeafDirective

  static getType(): string {
    return 'leafDirective'
  }

  static clone(node: LeafDirectiveNode): LeafDirectiveNode {
    return new LeafDirectiveNode(structuredClone(node.__mdastNode))
  }

  static importJSON(serializedNode: SerializedLeafDirectiveNode): LeafDirectiveNode {
    return $createLeafDirectiveNode(serializedNode.mdastNode)
  }

  constructor(mdastNode: LeafDirective, key?: NodeKey) {
    super(key)
    this.__mdastNode = mdastNode
  }

  getMdastNode(): LeafDirective {
    return this.__mdastNode
  }

  exportJSON(): SerializedLeafDirectiveNode {
    return {
      mdastNode: this.getMdastNode(),
      type: 'leafDirective',
      version: 1
    }
  }

  createDOM(): HTMLElement {
    return document.createElement('div')
  }

  updateDOM(): false {
    return false
  }

  setMdastNode(mdastNode: LeafDirective): void {
    this.getWritable().__mdastNode = mdastNode
  }

  decorate(
    parentEditor: LexicalEditor,
    {
      theme: {
        nodeDecoratorComponents: { LeafDirectiveEditor }
      }
    }: ExtendedEditorConfig
  ): JSX.Element {
    return <LeafDirectiveEditor leafDirective={this} mdastNode={this.getMdastNode()} parentEditor={parentEditor} />
  }

  isInline(): boolean {
    return false
  }

  isKeyboardSelectable(): boolean {
    return true
  }
}

/**
 * Creates an {@link LeafDirectiveNode}.
 */
export function $createLeafDirectiveNode(mdastNode: LeafDirective): LeafDirectiveNode {
  return new LeafDirectiveNode(mdastNode)
}

/**
 * Retruns true if the node is an {@link LeafDirectiveNode}.
 */
export function $isLeafDirectiveNode(node: LexicalNode | null | undefined): node is LeafDirectiveNode {
  return node instanceof LeafDirectiveNode
}
