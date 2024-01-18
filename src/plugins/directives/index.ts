import { realmPlugin } from '../../RealmWithPlugins'
import {
  addExportVisitor$,
  addImportVisitor$,
  addLexicalNode$,
  addMdastExtension$,
  addSyntaxExtension$,
  addToMarkdownExtension$,
  directiveDescriptors$,
  insertDecoratorNode$
} from '../core'
import { Signal, map } from '@mdxeditor/gurx'
import { LexicalEditor } from 'lexical'
import { Directives, directiveFromMarkdown, directiveToMarkdown } from 'mdast-util-directive'
import { directive } from 'micromark-extension-directive'
import { $createDirectiveNode, DirectiveNode } from './DirectiveNode'
import { DirectiveVisitor } from './DirectiveVisitor'
import { MdastDirectiveVisitor } from './MdastDirectiveVisitor'
export * from './DirectiveNode'

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
 * A signal that inserts a new directive node with the published payload.
 * @group Directive
 */
export const insertDirective$ = Signal<{
  type: Directives['type']
  name: string
  attributes?: Directives['attributes']
}>((r) => {
  r.link(
    r.pipe(
      insertDirective$,
      map((payload) => {
        return () => $createDirectiveNode({ children: [], ...payload })
      })
    ),
    insertDecoratorNode$
  )
})

/**
 * A plugin that adds support for markdown directives.
 * @group Directive
 */
export const directivesPlugin = realmPlugin<{
  /**
   * Use this to register your custom directive editors. You can also use the built-in {@link GenericDirectiveEditor}.
   */
  directiveDescriptors: DirectiveDescriptor<any>[]
}>({
  update: (realm, params) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    realm.pub(directiveDescriptors$, params?.directiveDescriptors || [])
  },

  init: (realm) => {
    realm.pubIn({
      // import
      [addMdastExtension$]: directiveFromMarkdown(),
      [addSyntaxExtension$]: directive(),
      [addImportVisitor$]: MdastDirectiveVisitor,
      // export
      [addLexicalNode$]: DirectiveNode,
      [addExportVisitor$]: DirectiveVisitor,
      [addToMarkdownExtension$]: directiveToMarkdown()
    })
  }
})
