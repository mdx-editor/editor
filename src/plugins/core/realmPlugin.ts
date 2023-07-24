import { $getRoot, Klass, LexicalEditor, LexicalNode, ParagraphNode, TextNode } from 'lexical'
import { RealmNode, realmPlugin, system } from '../../gurx'
import { InitialEditorStateType } from '@lexical/react/LexicalComposer'
import { MarkdownParseOptions, MdastImportVisitor, importMarkdownToLexical } from '../../import/importMarkdownToLexical'
import * as Mdast from 'mdast'
import { MdastRootVisitor } from './MdastRootVisitor'
import { MdastParagraphVisitor } from './MdastParagraphVisitor'
import { MdastTextVisitor } from './MdastTextVisitor'
import { LexicalConvertOptions, exportMarkdownFromLexical } from '../../export/exportMarkdownFromLexical'
import { LexicalRootVisitor } from './LexicalRootVisitor'
import { LexicalParagraphVisitor } from './LexicalParagraphVisitor'
import { LexicalTextVisitor } from './LexicalTextVisitor'
import { MdastFormattingVisitor } from './MdastFormattingVisitor'

export const coreSystem = system((r) => {
  const rootEditor = r.node<LexicalEditor | null>(null)
  const contentEditableClassName = r.node<string>('')

  const initialMarkdown = r.node<string>('')
  const markdown = r.node<string>('', true)
  r.link(initialMarkdown, markdown)

  // import configuration
  const importVisitors = r.node<MdastImportVisitor<Mdast.Content>[]>([])
  const syntaxExtensions = r.node<MarkdownParseOptions['syntaxExtensions']>([])
  const mdastExtensions = r.node<MarkdownParseOptions['mdastExtensions']>([])

  const usedLexicalNodes = r.node<Klass<LexicalNode>[]>([])

  // export configuration
  const exportVisitors = r.node<NonNullable<LexicalConvertOptions['visitors']>>([])
  const toMarkdownExtensions = r.node<NonNullable<LexicalConvertOptions['toMarkdownExtensions']>>([])
  const toMarkdownOptions = r.node<NonNullable<LexicalConvertOptions['toMarkdownOptions']>>({}, true)

  const jsxIsAvailable = r.node<boolean>(false)

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
  const addExportVisitor = createAppendNodeFor(exportVisitors)
  const addToMarkdownExtension = createAppendNodeFor(toMarkdownExtensions)
  const setMarkdown = r.node<string>()

  const initialRootEditorState = r.node<InitialEditorStateType>((theRootEditor) => {
    r.pub(rootEditor, theRootEditor)

    ////////////////////////
    // setup Export
    ////////////////////////

    theRootEditor.registerUpdateListener(({ dirtyElements, dirtyLeaves, editorState }) => {
      if (dirtyElements.size === 0 && dirtyLeaves.size === 0) {
        return
      }

      let theNewMarkdownValue!: string

      editorState.read(() => {
        theNewMarkdownValue = exportMarkdownFromLexical({
          root: $getRoot(),
          visitors: r.getValue(exportVisitors),
          jsxComponentDescriptors: [],
          toMarkdownExtensions: r.getValue(toMarkdownExtensions),
          toMarkdownOptions: r.getValue(toMarkdownOptions),
          jsxIsAvailable: r.getValue(jsxIsAvailable)
        })
      })

      r.pub(markdown, theNewMarkdownValue.trim())
    })

    ////////////////////////
    // Import initial value
    ////////////////////////
    importMarkdownToLexical({
      root: $getRoot(),
      visitors: r.getValue(importVisitors),
      mdastExtensions: r.getValue(mdastExtensions),
      markdown: r.getValue(initialMarkdown),
      syntaxExtensions: r.getValue(syntaxExtensions)
    })
  })

  r.sub(
    r.pipe(setMarkdown, r.o.withLatestFrom(rootEditor, importVisitors, mdastExtensions, syntaxExtensions)),
    ([theNewMarkdownValue, editor, importVisitors, mdastExtensions, syntaxExtensions]) => {
      editor?.update(() => {
        $getRoot().clear()
        importMarkdownToLexical({
          root: $getRoot(),
          visitors: importVisitors,
          mdastExtensions,
          markdown: theNewMarkdownValue,
          syntaxExtensions
        })
      })
    }
  )

  return {
    jsxIsAvailable,
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
    addMdastExtension,
    exportVisitors,
    toMarkdownOptions,
    toMarkdownExtensions,
    addExportVisitor,
    addToMarkdownExtension,
    setMarkdown,
    markdown
  }
}, [])

interface CorePluginParams {
  initialMarkdown: string
  contentEditableClassName: string
  onChange: (markdown: string) => void
  toMarkdownOptions: NonNullable<LexicalConvertOptions['toMarkdownOptions']>
}

export const [corePlugin, corePluginHooks] = realmPlugin({
  systemSpec: coreSystem,

  applyParamsToSystem(realm, params: CorePluginParams) {
    realm.pubKey('contentEditableClassName', params.contentEditableClassName)
    realm.pubKey('toMarkdownOptions', params.toMarkdownOptions)
    realm.singletonSubKey('markdown', params.onChange)
  },

  init(realm, params: CorePluginParams) {
    realm.pubKey('initialMarkdown', params.initialMarkdown.trim())

    // core import visitors
    realm.pubKey('addImportVisitor', MdastRootVisitor)
    realm.pubKey('addImportVisitor', MdastParagraphVisitor)
    realm.pubKey('addImportVisitor', MdastTextVisitor)
    realm.pubKey('addImportVisitor', MdastFormattingVisitor)

    // basic lexical nodes
    realm.pubKey('addLexicalNode', ParagraphNode)
    realm.pubKey('addLexicalNode', TextNode)

    // core export visitors
    realm.pubKey('addExportVisitor', LexicalRootVisitor)
    realm.pubKey('addExportVisitor', LexicalParagraphVisitor)
    realm.pubKey('addExportVisitor', LexicalTextVisitor)
  }
})
