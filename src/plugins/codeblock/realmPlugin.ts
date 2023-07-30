import { CodeBlockVisitor } from './CodeBlockVisitor'
import { realmPlugin, system } from '../../gurx'
import { MdastCodeVisitor } from './MdastCodeVisitor'
import { coreSystem } from '../core/realmPlugin'
import { $createCodeBlockNode, CodeBlockNode, CreateCodeBlockNodeOptions } from './CodeBlockNode'
import { $insertNodeToNearestRoot } from '@lexical/utils'
import { $getRoot, $getSelection, $isRangeSelection } from 'lexical'

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
    const insertCodeBlock = r.node<Partial<CreateCodeBlockNodeOptions>>()
    const defaultCodeBlockLanguage = r.node<string>('')

    r.sub(
      r.pipe(insertCodeBlock, r.o.withLatestFrom(rootEditor, defaultCodeBlockLanguage)),
      ([payload, theEditor, defaultCodeBlockLanguage]) => {
        theEditor?.focus(
          () => {
            theEditor.getEditorState().read(() => {
              const selection = $getSelection()
              console.log({ selection })
              if ($isRangeSelection(selection)) {
                const focusNode = selection.focus.getNode()

                if (focusNode !== null) {
                  if (!payload.language) {
                    payload.language = defaultCodeBlockLanguage
                  }
                  theEditor.update(() => {
                    const codeBlockNode = $createCodeBlockNode(payload)

                    $insertNodeToNearestRoot(codeBlockNode)
                    // TODO: hack, the editor decorations are not synchronous ;(
                    setTimeout(() => codeBlockNode.select(), 80)
                  })
                }
              }
            })
          },
          { defaultSelection: 'rootEnd' }
        )
      }
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
