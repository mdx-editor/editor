import React from 'react'
import type { EditorConfig, LexicalEditor, LexicalNode, NodeKey, SerializedLexicalNode, Spread } from 'lexical'
import { DecoratorNode } from 'lexical'
import { Directives } from 'mdast-util-directive'
import { NestedEditorsContext } from '../core/NestedLexicalEditor'
import { VoidEmitter, voidEmitter } from '../../utils/voidEmitter'
import { useCellValues } from '@mdxeditor/gurx'
import { directiveDescriptors$ } from '../core'

/**
 * A serialized representation of an {@link DirectiveNode}.
 * @group Directive
 */
export type SerializedDirectiveNode = Spread<
  {
    mdastNode: Directives
    type: 'directive'
    version: 1
  },
  SerializedLexicalNode
>

/**
 * A lexical node that represents an image. Use {@link "$createDirectiveNode"} to construct one.
 * @group Directive
 */
export class DirectiveNode extends DecoratorNode<React.JSX.Element> {
  /** @internal */
  __mdastNode: Directives
  /** @internal */
  __focusEmitter = voidEmitter()

  /** @internal */
  static getType(): string {
    return 'directive'
  }

  /** @internal */
  static clone(node: DirectiveNode): DirectiveNode {
    return new DirectiveNode(structuredClone(node.__mdastNode), node.__key)
  }

  /** @internal */
  static importJSON(serializedNode: SerializedDirectiveNode): DirectiveNode {
    return $createDirectiveNode(serializedNode.mdastNode)
  }

  /**
   * Constructs a new {@link DirectiveNode} with the specified MDAST directive node as the object to edit.
   */
  constructor(mdastNode: Directives, key?: NodeKey) {
    super(key)
    this.__mdastNode = mdastNode
  }

  /**
   * Returns the MDAST node that is being edited.
   */
  getMdastNode(): Directives {
    return this.__mdastNode
  }

  /** @internal */
  exportJSON(): SerializedDirectiveNode {
    return {
      mdastNode: structuredClone(this.__mdastNode),
      type: 'directive',
      version: 1
    }
  }

  /** @internal */
  createDOM(): HTMLElement {
    return document.createElement(this.__mdastNode.type === 'textDirective' ? 'span' : 'div')
  }

  /** @internal */
  updateDOM(): false {
    return false
  }

  /**
   * Sets a new MDAST node to edit.
   */
  setMdastNode(mdastNode: Directives): void {
    this.getWritable().__mdastNode = mdastNode
  }

  /**
   * Focuses the direcitive editor.
   */
  select = () => {
    this.__focusEmitter.publish()
  }

  /** @internal */
  decorate(parentEditor: LexicalEditor, config: EditorConfig): JSX.Element {
    return (
      <DirectiveEditorContainer
        lexicalNode={this}
        mdastNode={this.getMdastNode()}
        parentEditor={parentEditor}
        config={config}
        focusEmitter={this.__focusEmitter}
      />
    )
  }

  /** @internal */
  isInline(): boolean {
    return this.__mdastNode.type === 'textDirective'
  }

  /** @internal */
  isKeyboardSelectable(): boolean {
    return true
  }
}

const DirectiveEditorContainer: React.FC<{
  parentEditor: LexicalEditor
  lexicalNode: DirectiveNode
  mdastNode: Directives
  config: EditorConfig
  focusEmitter: VoidEmitter
}> = (props) => {
  const { mdastNode } = props
  const [directiveDescriptors] = useCellValues(directiveDescriptors$)
  const descriptor = directiveDescriptors.find((descriptor) => descriptor.testNode(mdastNode))
  if (!descriptor) {
    throw new Error(`No descriptor found for directive ${mdastNode.name}`)
  }

  const Editor = descriptor.Editor

  return (
    <NestedEditorsContext.Provider value={props}>
      <Editor descriptor={descriptor} mdastNode={mdastNode} lexicalNode={props.lexicalNode} parentEditor={props.parentEditor} />
    </NestedEditorsContext.Provider>
  )
}

/**
 * Creates an {@link DirectiveNode}. Use this instead of the constructor to follow the Lexical conventions.
 * @group Directive
 */
export function $createDirectiveNode(mdastNode: Directives, key?: NodeKey): DirectiveNode {
  return new DirectiveNode(mdastNode, key)
}

/**
 * Returns true if the node is an {@link DirectiveNode}.
 * @group Directive
 */
export function $isDirectiveNode(node: LexicalNode | null | undefined): node is DirectiveNode {
  return node instanceof DirectiveNode
}
