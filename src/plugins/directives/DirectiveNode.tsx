import React from 'react'
import type { EditorConfig, LexicalEditor, LexicalNode, NodeKey, SerializedLexicalNode, Spread } from 'lexical'
import { DecoratorNode } from 'lexical'
import { Directive } from 'mdast-util-directive'
import { NestedEditorsContext } from '../core/NestedLexicalEditor'
import { directivesPluginHooks } from './realmPlugin'
import { VoidEmitter, voidEmitter } from '../../utils/voidEmitter'

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

let GENERATION = 0
/**
 * A lexical node that represents an image. Use {@link "$createDirectiveNode"} to construct one.
 */
export class DirectiveNode extends DecoratorNode<React.JSX.Element> {
  __mdastNode: Directive
  __focusEmitter = voidEmitter()

  static getType(): string {
    return 'directive'
  }

  static clone(node: DirectiveNode): DirectiveNode {
    return new DirectiveNode(structuredClone(node.__mdastNode), node.__key)
  }

  static importJSON(serializedNode: SerializedDirectiveNode): DirectiveNode {
    return $createDirectiveNode(serializedNode.mdastNode)
  }

  constructor(mdastNode: Directive, key?: NodeKey) {
    super(key)
    this.__mdastNode = mdastNode
    this.generation = GENERATION++
  }

  getMdastNode(): Directive {
    return this.__mdastNode
  }

  exportJSON(): SerializedDirectiveNode {
    return {
      mdastNode: structuredClone(this.__mdastNode),
      type: 'directive',
      version: 1
    }
  }

  createDOM(): HTMLElement {
    return document.createElement(this.__mdastNode.type === 'textDirective' ? 'span' : 'div')
  }

  updateDOM(): false {
    return false
  }

  setMdastNode(mdastNode: Directive): void {
    this.getWritable().__mdastNode = mdastNode
  }

  select = () => {
    this.__focusEmitter.publish()
  }

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

  isInline(): boolean {
    return this.__mdastNode.type === 'textDirective'
  }

  isKeyboardSelectable(): boolean {
    return true
  }
}

export function DirectiveEditorContainer(props: {
  parentEditor: LexicalEditor
  lexicalNode: DirectiveNode
  mdastNode: Directive
  config: EditorConfig
  focusEmitter: VoidEmitter
}) {
  const { mdastNode } = props
  const [directiveDescriptors] = directivesPluginHooks.useEmitterValues('directiveDescriptors')
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
 * Creates an {@link DirectiveNode}.
 */
export function $createDirectiveNode(mdastNode: Directive, key?: NodeKey): DirectiveNode {
  return new DirectiveNode(mdastNode, key)
}

/**
 * Retruns true if the node is an {@link DirectiveNode}.
 */
export function $isDirectiveNode(node: LexicalNode | null | undefined): node is DirectiveNode {
  return node instanceof DirectiveNode
}
