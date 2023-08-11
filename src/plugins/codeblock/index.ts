import { CodeBlockVisitor } from './CodeBlockVisitor'
import { realmPlugin, system } from '../../gurx'
import { MdastCodeVisitor } from './MdastCodeVisitor'
import { coreSystem } from '../core'
import { $createCodeBlockNode, CodeBlockNode, CreateCodeBlockNodeOptions } from './CodeBlockNode'
import { VoidEmitter } from '../../utils/voidEmitter'

export type { CodeBlockEditorContextValue, CreateCodeBlockNodeOptions } from './CodeBlockNode'
export { useCodeBlockEditorContext } from './CodeBlockNode'

/**
 * The properties passed to the {@link CodeBlockEditorDescriptor.Editor} component.
 */
export interface CodeBlockEditorProps {
  /**
   * The code to edit.
   */
  code: string
  /**
   * The language of the fenced code block.
   */
  language: string
  /**
   * The meta of the fenced code block.
   */
  meta: string
  /**
   * The key of the Lexical node - use this if you are dealing with the Lexical APIs.
   */
  nodeKey: string
  /**
   * An emitter that will execute its subscription when the editor should be focused.
   * Note: you don't need to unsubscribe, the emiter has a single subscription model.
   */
  focusEmitter: VoidEmitter
}

/**
 * Implement this interface to create a custom code block editor.
 * Pass the object in the codeBlockPlugin parameters.
 */
export interface CodeBlockEditorDescriptor {
  /**
   * The priority of the descriptor when descriptors are matched against a given code block. Lower number means lower priority.
   * This allows you to implement a catch-all generic editor and a more specific editor for a given language / meta.
   */
  priority: number
  /**
   * A function that returns true if the descriptor's editor should be used for the given code block.
   * @param language - The language of the code block.
   * @param meta - The meta of the code block.
   */
  match: (language: string, meta: string) => boolean
  /**
   * The React component to be used. See {@link CodeBlockEditorProps} for the props passed to the component.
   */
  Editor: React.ComponentType<CodeBlockEditorProps>
}

/**
 * @internal
 */
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

/**
 * The parameters passed to the codeBlockPlugin initializer.
 */
export interface CodeBlockPluginParams {
  /**
   * Use this to register custom code block editors.
   */
  codeBlockEditorDescriptors?: CodeBlockEditorDescriptor[]
  /**
   * The default language to use when creating a new code block if no language is passed.
   */
  defaultCodeBlockLanguage?: string
}

export const [
  /**
   * @internal
   */
  codeBlockPlugin,

  /**
   * @internal
   */
  codeBlockPluginHooks
] = realmPlugin({
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
