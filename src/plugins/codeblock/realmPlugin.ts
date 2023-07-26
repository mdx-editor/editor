import { CodeBlockVisitor } from './CodeBlockVisitor'
import { realmPlugin, system } from '../../gurx'
import { MdastCodeVisitor } from './MdastCodeVisitor'
import { coreSystem } from '../core/realmPlugin'
import { CodeBlockNode } from './CodeBlockNode'

export interface CodeBlockEditorDescriptor {
  priority: number
  match: (language: string, meta: string) => boolean
  Editor: React.ComponentType<{ code: string; language: string; meta: string }>
}

export const codeBlockSystem = system(
  (r) => {
    const codeBlockEditorDescriptors = r.node<CodeBlockEditorDescriptor[]>([])
    const appendCodeBlockEditorDescriptor = r.node<CodeBlockEditorDescriptor>()

    r.link(
      r.pipe(
        appendCodeBlockEditorDescriptor,
        r.o.withLatestFrom(codeBlockEditorDescriptors),
        r.o.map(([newValue, values]) => {
          if (values.includes(newValue)) {
            return values
          }
          return [...values, newValue]
        })
      ),
      codeBlockEditorDescriptors
    )

    return {
      codeBlockEditorDescriptors,
      appendCodeBlockEditorDescriptor
    }
  },
  [coreSystem]
)

export interface CodeBlockPluginParams {
  codeBlockEditorDescriptors?: CodeBlockEditorDescriptor[]
}

export const [codeBlockPlugin, codeBlockPluginHooks] = realmPlugin({
  systemSpec: codeBlockSystem,
  // applyParamsToSystem: (realm, params: CodeBlockPluginParams) => {},

  init: (realm, params: CodeBlockPluginParams) => {
    realm.pubKey('codeBlockEditorDescriptors', params.codeBlockEditorDescriptors || [])
    // import
    realm.pubKey('addImportVisitor', MdastCodeVisitor)
    // export
    realm.pubKey('addLexicalNode', CodeBlockNode)
    realm.pubKey('addExportVisitor', CodeBlockVisitor)
  }
})
