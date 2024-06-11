import { CodeBlockVisitor } from './CodeBlockVisitor'
import { MdastCodeVisitor } from './MdastCodeVisitor'
import {
  Appender,
  addActivePlugin$,
  addExportVisitor$,
  addImportVisitor$,
  addLexicalNode$,
  codeBlockEditorDescriptors$,
  insertDecoratorNode$
} from '../core'
import { $createCodeBlockNode, CodeBlockNode, CreateCodeBlockNodeOptions } from './CodeBlockNode'
import { Cell, Signal, map, withLatestFrom } from '@mdxeditor/gurx'
import { realmPlugin } from '../../RealmWithPlugins'
import { CodeBlockEditorDescriptor } from './utils'

export type { CodeBlockEditorContextValue, CreateCodeBlockNodeOptions } from './CodeBlockNode'
export { useCodeBlockEditorContext } from './CodeBlockNode'

/**
 * Contains the default language to use when creating a new code block if no language is passed.
 * @group Code Block
 */
export const defaultCodeBlockLanguage$ = Cell<string>('')

/**
 * A signal that inserts a new code block into the editor with the published options.
 * @group Code Block
 */
export const insertCodeBlock$ = Signal<Partial<CreateCodeBlockNodeOptions>>((r) => {
  r.link(
    r.pipe(
      insertCodeBlock$,
      withLatestFrom(defaultCodeBlockLanguage$),
      map(
        ([payload, defaultCodeBlockLanguage]) =>
          () =>
            $createCodeBlockNode({ language: defaultCodeBlockLanguage, ...payload })
      )
    ),
    insertDecoratorNode$
  )
})

/**
 * A signal that appends a code block editor descriptor to the list of descriptors.
 * @group Code Block
 */
export const appendCodeBlockEditorDescriptor$ = Appender(codeBlockEditorDescriptors$)

/**
 * A plugin that adds support for code blocks and custom code block editors.
 * @group Code Block
 */
export const codeBlockPlugin = realmPlugin<{
  /**
   * Pass an array of {@link CodeBlockEditorDescriptor} to register custom code block editors.
   */
  codeBlockEditorDescriptors?: CodeBlockEditorDescriptor[]
  /**
   * The default language to use when creating a new code block if no language is passed.
   */
  defaultCodeBlockLanguage?: string
}>({
  update(realm, params) {
    realm.pub(defaultCodeBlockLanguage$, params?.defaultCodeBlockLanguage ?? '')
  },

  init(realm, params) {
    realm.pubIn({
      [addActivePlugin$]: 'codeblock',
      [codeBlockEditorDescriptors$]: params?.codeBlockEditorDescriptors ?? [],
      [addImportVisitor$]: MdastCodeVisitor,
      [addLexicalNode$]: CodeBlockNode,
      [addExportVisitor$]: CodeBlockVisitor
    })
  }
})
