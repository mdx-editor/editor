import React from 'react'
import type { EditorConfig, LexicalEditor, LexicalNode, NodeKey, SerializedLexicalNode, Spread } from 'lexical'
import { DecoratorNode } from 'lexical'
import { Directives } from 'mdast-util-directive'
import { VoidEmitter, voidEmitter } from '../../utils/voidEmitter'
import { Cell, useCellValues } from '@mdxeditor/gurx'
import { Node } from 'unist'

/**
 * The value of the {@link NestedEditorsContext} React context.
 * @group Custom Editor Primitives
 */
export interface NestedEditorsContextValue<T extends Node> {
  /**
   * The parent lexical editor
   */
  parentEditor: LexicalEditor
  /**
   * The parent editor config
   */
  config: EditorConfig
  /**
   * The mdast node that is being edited
   */
  mdastNode: T
  /**
   * The lexical node that is being edited
   */
  lexicalNode: DecoratorNode<any> & {
    /**
     * Use this method to update the mdast node. This will also update the mdast tree of the parent editor.
     */
    setMdastNode: (mdastNode: any) => void
  }
  /**
   * Subscribe to the emitter and implement the logic to focus the custom editor.
   */
  focusEmitter: VoidEmitter
}

/**
 * Use this context to provide the necessary values to the {@link NestedLexicalEditor} React component.
 * Place it as a wrapper in your custom lexical node decorators.
 * @group Custom Editor Primitives
 */
export const NestedEditorsContext = React.createContext<NestedEditorsContextValue<Node> | undefined>(undefined)

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

export const directiveDescriptors$ = Cell<DirectiveDescriptor[]>([])

/**
 * Implement this interface to create a custom editor for markdown directives.
 * Pass the object in the `directivesPlugin` parameters.
 * @group Directive
 */
export interface DirectiveDescriptor<T extends Directives = Directives> {
  /**
   * Whether the descriptor's Editor should be used for the given node.
   * @param node - The directive mdast node. You can code your logic against the node's name, type, attributes, children, etc.
   */
  testNode(node: Directives): boolean
  /**
   * The name of the descriptor - use this if you're building UI for the user to select a directive.
   */
  name: string
  /**
   * The attributes that the directive has. This can be used when building the UI for the user to configure a directive. The {@link GenericDirectiveEditor} uses those to display a property form.
   */
  attributes: string[]
  /**
   * Whether or not the directive has inner markdown content as children. Used by the {@link GenericDirectiveEditor} to determine whether to show the inner markdown editor.
   */
  hasChildren: boolean
  /**
   * The type of the supported directive. Can be one of: 'leafDirective' | 'containerDirective' | 'textDirective'.
   */
  type?: 'leafDirective' | 'containerDirective' | 'textDirective'
  /**
   * The React component to be used as an Editor. See {@link DirectiveEditorProps} for the props passed to the component.
   */
  Editor: React.ComponentType<DirectiveEditorProps<T>>
}

/**
 * The properties passed to the {@link DirectiveDescriptor.Editor} component.
 * @group Directive
 */
export interface DirectiveEditorProps<T extends Directives = Directives> {
  /**
   * The mdast directive node.
   */
  mdastNode: T
  /**
   * The parent lexical editor - use this if you are dealing with the Lexical APIs.
   */
  parentEditor: LexicalEditor
  /**
   * The Lexical directive node.
   */
  lexicalNode: DirectiveNode
  /**
   * The descriptor that activated the editor
   */
  descriptor: DirectiveDescriptor
}

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
 * Retruns true if the node is an {@link DirectiveNode}.
 * @group Directive
 */
export function $isDirectiveNode(node: LexicalNode | null | undefined): node is DirectiveNode {
  return node instanceof DirectiveNode
}
