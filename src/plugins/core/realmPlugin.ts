import { $getRoot, Klass, LexicalEditor, LexicalNode, ParagraphNode, TextNode } from 'lexical'
import { RealmNode, realmPlugin, system } from '../../gurx'
import { InitialEditorStateType } from '@lexical/react/LexicalComposer'
import { MarkdownParseOptions, MdastImportVisitor, importMarkdownToLexical } from '../../import'
import * as Mdast from 'mdast'
import { MdastRootVisitor } from './MdastRootVisitor'
import { MdastParagraphVisitor } from './MdastParagraphVisitor'
import { MdastTextVisitor } from './MdastTextVisitor'

export const coreSystem = system((r) => {
  const rootEditor = r.node<LexicalEditor | null>(null)
  const contentEditableClassName = r.node<string>('')
  const importVisitors = r.node<MdastImportVisitor<Mdast.Content>[]>([])
  const syntaxExtensions = r.node<MarkdownParseOptions['syntaxExtensions']>([])
  const mdastExtensions = r.node<MarkdownParseOptions['mdastExtensions']>([])
  const initialMarkdown = r.node<string>('')
  const usedLexicalNodes = r.node<Klass<LexicalNode>[]>([])

  function createAppendNodeFor<T>(node: RealmNode<T[]>) {
    const appendNode = r.node<T>()

    r.link(
      r.pipe(
        appendNode,
        r.o.withLatestFrom(node),
        r.o.map(([newValue, values]) => {
          if (values.includes(newValue)) {
            return values
          }
          return [...values, newValue]
        })
      ),
      node
    )
    return appendNode
  }
  const addLexicalNode = createAppendNodeFor(usedLexicalNodes)
  const addImportVisitor = createAppendNodeFor(importVisitors)
  const addSyntaxExtension = createAppendNodeFor(syntaxExtensions)
  const addMdastExtension = createAppendNodeFor(mdastExtensions)

  const initialRootEditorState = r.node<InitialEditorStateType>((editor) => {
    r.pub(rootEditor, editor)

    importMarkdownToLexical({
      root: $getRoot(),
      visitors: r.getValue(importVisitors),
      mdastExtensions: r.getValue(mdastExtensions),
      markdown: r.getValue(initialMarkdown),
      syntaxExtensions: r.getValue(syntaxExtensions)
    })
  })

  return {
    contentEditableClassName,
    initialRootEditorState,
    rootEditor,
    initialMarkdown,
    importVisitors,
    syntaxExtensions,
    mdastExtensions,
    usedLexicalNodes,
    addImportVisitor,
    addLexicalNode,
    addSyntaxExtension,
    addMdastExtension
  }
}, [])

interface CorePluginParams {
  initialMarkdown: string
  contentEditableClassName: string
}

export const [corePlugin, corePluginHooks] = realmPlugin({
  systemSpec: coreSystem,

  applyParamsToSystem(realm, params: CorePluginParams) {
    realm.pubKey('contentEditableClassName', params.contentEditableClassName)
  },

  init(realm, params: CorePluginParams) {
    realm.pubKey('initialMarkdown', params.initialMarkdown)

    // built-in visitors
    realm.pubKey('addImportVisitor', MdastRootVisitor)
    realm.pubKey('addImportVisitor', MdastParagraphVisitor)
    realm.pubKey('addImportVisitor', MdastTextVisitor)

    // basic lexical nodes
    realm.pubKey('addLexicalNode', ParagraphNode)
    realm.pubKey('addLexicalNode', TextNode)
  }
})
