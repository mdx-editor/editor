import { DecoratorNode, EditorConfig, LexicalEditor } from 'lexical'
import { DirectiveNode } from './DirectiveNode'
import { Directives } from 'mdast-util-directive'
import { VoidEmitter } from '@/utils/voidEmitter'
import { Node } from 'unist'

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
