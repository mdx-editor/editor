import { Directive } from 'mdast-util-directive'
import { realmPlugin, system } from '../../gurx'
import { coreSystem } from '../core/realmPlugin'
import { directive } from 'micromark-extension-directive'
import { directiveFromMarkdown, directiveToMarkdown } from 'mdast-util-directive'
import { DirectiveNode } from './DirectiveNode'
import { DirectiveVisitor } from './DirectiveVisitor'
import { MdastDirectiveVisitor } from './MdastDirectiveVisitor'
import { LexicalEditor } from 'lexical'

export interface DirectiveDescriptor<T extends Directive = Directive> {
  testNode: (node: Directive) => boolean
  name: string
  attributes: string[]
  hasChildren: boolean
  Editor: React.ComponentType<DirectiveEditorProps<T>>
}

export interface DirectiveEditorProps<T extends Directive = Directive> {
  mdastNode: T
  parentEditor: LexicalEditor
  lexicalNode: DirectiveNode
  descriptor: DirectiveDescriptor
}

export const directivesSystem = system(
  (r) => {
    const directiveDescriptors = r.node<DirectiveDescriptor<any>[]>([])

    return {
      directiveDescriptors
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
