import React from 'react'
import type { LexicalEditor, LexicalNode, NodeKey, SerializedLexicalNode, Spread } from 'lexical'

import { DecoratorNode } from 'lexical'
import { ContainerDirective, Directive, LeafDirective } from 'mdast-util-directive'
import { TextDirective } from 'mdast-util-directive/lib'

/**
 * A serialized representation of an {@link DirectiveNode}.
 */
export type SerializedDirectiveNode = Spread<
  {
    mdastNode: Directive
    type: 'directive'
    version: 1
  },
  SerializedLexicalNode
>

/**
 * A lexical node that represents an image. Use {@link "$createDirectiveNode"} to construct one.
 */
export class DirectiveNode extends DecoratorNode<Directive> {
  __mdastNode: Directive

  static getType(): string {
    return 'directive'
  }

  static clone(node: DirectiveNode): DirectiveNode {
    return new DirectiveNode(structuredClone(node.__mdastNode))
  }

  static importJSON(serializedNode: SerializedDirectiveNode): DirectiveNode {
    return $createDirectiveNode(serializedNode.mdastNode)
  }

  constructor(mdastNode: Directive, key?: NodeKey) {
    super(key)
    this.__mdastNode = mdastNode
  }

  getMdastNode(): Directive {
    return this.__mdastNode
  }

  exportJSON(): SerializedDirectiveNode {
    return {
      mdastNode: this.getMdastNode(),
      type: 'directive',
      version: 1
    }
  }

  createDOM(): HTMLElement {
    return document.createElement('div')
  }

  updateDOM(): false {
    return false
  }

  setMdastNode(mdastNode: Directive): void {
    this.getWritable().__mdastNode = mdastNode
  }

  decorate(parentEditor: LexicalEditor): JSX.Element {
    return <DirectiveEditor leafDirective={this} mdastNode={this.getMdastNode()} parentEditor={parentEditor} />
  }

  isInline(): boolean {
    return false
  }

  isKeyboardSelectable(): boolean {
    return true
  }
}

/**
 * Creates an {@link DirectiveNode}.
 */
export function $createDirectiveNode(mdastNode: Directive): DirectiveNode {
  return new DirectiveNode(mdastNode)
}

/**
 * Retruns true if the node is an {@link DirectiveNode}.
 */
export function $isDirectiveNode(node: LexicalNode | null | undefined): node is DirectiveNode {
  return node instanceof DirectiveNode
}
