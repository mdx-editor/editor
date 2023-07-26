import { CodeBlockVisitor } from './CodeBlockVisitor'
import { realmPlugin, system } from '../../gurx'
import { MdastCodeVisitor } from './MdastCodeVisitor'
import { coreSystem } from '../core/realmPlugin'
import { $createCodeBlockNode, CodeBlockNode, CreateCodeBlockNodeOptions } from './CodeBlockNode'
import { $insertNodeToNearestRoot } from '@lexical/utils'
import { $getSelection, $isRangeSelection } from 'lexical'

export interface VoidEmitter {
  subscribe: (cb: () => void) => void
}

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
  (r, [{ rootEditor }]) => {
    const codeBlockEditorDescriptors = r.node<CodeBlockEditorDescriptor[]>([])
    const appendCodeBlockEditorDescriptor = r.node<CodeBlockEditorDescriptor>()
    const insertCodeBlock = r.node<CreateCodeBlockNodeOptions>()

    r.sub(r.pipe(insertCodeBlock, r.o.withLatestFrom(rootEditor)), ([payload, theEditor]) => {
      theEditor?.getEditorState().read(() => {
        const selection = $getSelection()

        if ($isRangeSelection(selection)) {
          const focusNode = selection.focus.getNode()

          if (focusNode !== null) {
            theEditor.update(() => {
              const codeBlockNode = $createCodeBlockNode(payload)

              $insertNodeToNearestRoot(codeBlockNode)
              // TODO: hack, the editor decorations are not synchronous ;(
              setTimeout(() => codeBlockNode.select(), 80)
            })
          }
        }
      })
    })

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
      appendCodeBlockEditorDescriptor,
      insertCodeBlock
    }
  },
  [coreSystem]
)

export interface CodeBlockPluginParams {
  codeBlockEditorDescriptors?: CodeBlockEditorDescriptor[]
}

export const [codeBlockPlugin, codeBlockPluginHooks] = realmPlugin({
  systemSpec: codeBlockSystem,

  init: (realm, params: CodeBlockPluginParams) => {
    realm.pubKey('codeBlockEditorDescriptors', params.codeBlockEditorDescriptors || [])
    // import
    realm.pubKey('addImportVisitor', MdastCodeVisitor)
    // export
    realm.pubKey('addLexicalNode', CodeBlockNode)
    realm.pubKey('addExportVisitor', CodeBlockVisitor)
  }
})
