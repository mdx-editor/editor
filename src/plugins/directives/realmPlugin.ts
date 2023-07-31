import { Directive } from 'mdast-util-directive'
import { realmPlugin, system } from '../../gurx'
import { coreSystem } from '../core/realmPlugin'
import { directive } from 'micromark-extension-directive'
import { directiveFromMarkdown, directiveToMarkdown } from 'mdast-util-directive'
import { DirectiveNode, $createDirectiveNode } from './DirectiveNode'
import { DirectiveVisitor } from './DirectiveVisitor'
import { MdastDirectiveVisitor } from './MdastDirectiveVisitor'
import { LexicalEditor } from 'lexical'
import { VoidEmitter } from '../../utils/voidEmitter'

export interface DirectiveDescriptor<T extends Directive = Directive> {
  testNode: (node: Directive) => boolean
  name: string
  attributes: string[]
  hasChildren: boolean
  type?: 'leafDirective' | 'containerDirective' | 'textDirective'
  Editor: React.ComponentType<DirectiveEditorProps<T>>
}

export interface DirectiveEditorProps<T extends Directive = Directive> {
  mdastNode: T
  parentEditor: LexicalEditor
  lexicalNode: DirectiveNode
  descriptor: DirectiveDescriptor
}

interface InsertDirectivePayload {
  type: Directive['type']
  name: string
  attributes?: Directive['attributes']
}

export const directivesSystem = system(
  (r, [{ insertDecoratorNode }]) => {
    const directiveDescriptors = r.node<DirectiveDescriptor<any>[]>([])

    const insertDirective = r.node<InsertDirectivePayload>()

    r.link(
      r.pipe(
        insertDirective,
        r.o.map((payload) => {
          return () => $createDirectiveNode({ children: [], ...payload })
        })
      ),
      insertDecoratorNode
    )

    return {
      directiveDescriptors,
      insertDirective
    }
  },
  [coreSystem]
)

export interface DirectivesPluginParams {
  directiveDescriptors: DirectiveDescriptor<any>[]
}

export const [directivesPlugin, directivesPluginHooks] = realmPlugin({
  systemSpec: directivesSystem,
  applyParamsToSystem: (realm, params: DirectivesPluginParams) => {
    realm.pubKey('directiveDescriptors', params?.directiveDescriptors || [])
  },

  init: (realm, _: DirectivesPluginParams) => {
    // import
    realm.pubKey('addMdastExtension', directiveFromMarkdown)
    realm.pubKey('addSyntaxExtension', directive())
    realm.pubKey('addImportVisitor', MdastDirectiveVisitor)

    // export
    realm.pubKey('addLexicalNode', DirectiveNode)
    realm.pubKey('addExportVisitor', DirectiveVisitor)
    realm.pubKey('addToMarkdownExtension', directiveToMarkdown)
  }
})
