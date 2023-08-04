import { CodeBlockVisitor } from './CodeBlockVisitor'
import { realmPlugin, system } from '../../gurx'
import { MdastCodeVisitor } from './MdastCodeVisitor'
import { coreSystem } from '../core'
import { $createCodeBlockNode, CodeBlockNode, CreateCodeBlockNodeOptions } from './CodeBlockNode'
import { VoidEmitter } from '../../utils/voidEmitter'
export { useCodeBlockEditorContext } from './CodeBlockNode'

export interface CodeBlockEditorProps {
  code: string
  language: string
  meta: string
  nodeKey: string
  focusEmitter: VoidEmitter
}

export interface CodeBlockEditorDescriptor {
  priority: number
  match: (language: string, meta: string) => boolean
  Editor: React.ComponentType<CodeBlockEditorProps>
}

export const codeBlockSystem = system(
  (r, [{ insertDecoratorNode }]) => {
    const codeBlockEditorDescriptors = r.node<CodeBlockEditorDescriptor[]>([])
    const appendCodeBlockEditorDescriptor = r.node<CodeBlockEditorDescriptor>()
    const insertCodeBlock = r.node<Partial<CreateCodeBlockNodeOptions>>()
    const defaultCodeBlockLanguage = r.node<string>('')

    r.link(
      r.pipe(
        insertCodeBlock,
        r.o.withLatestFrom(defaultCodeBlockLanguage),
        r.o.map(
          ([payload, defaultCodeBlockLanguage]) =>
            () =>
              $createCodeBlockNode({ language: defaultCodeBlockLanguage, ...payload })
        )
      ),
      insertDecoratorNode
    )

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
      defaultCodeBlockLanguage,
      appendCodeBlockEditorDescriptor,
      insertCodeBlock
    }
  },
  [coreSystem]
)

export interface CodeBlockPluginParams {
  codeBlockEditorDescriptors?: CodeBlockEditorDescriptor[]
  defaultCodeBlockLanguage?: string
}

export const [codeBlockPlugin, codeBlockPluginHooks] = realmPlugin({
  id: 'codeblock',
  systemSpec: codeBlockSystem,

  applyParamsToSystem(realm, params?: CodeBlockPluginParams) {
    realm.pubKey('defaultCodeBlockLanguage', params?.defaultCodeBlockLanguage || '')
  },

  init: (realm, params: CodeBlockPluginParams) => {
    realm.pubKey('codeBlockEditorDescriptors', params?.codeBlockEditorDescriptors || [])
    // import
    realm.pubKey('addImportVisitor', MdastCodeVisitor)
    // export
    realm.pubKey('addLexicalNode', CodeBlockNode)
    realm.pubKey('addExportVisitor', CodeBlockVisitor)
  }
})
