/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary'
import { HorizontalRulePlugin } from '@lexical/react/LexicalHorizontalRulePlugin'
import { LinkPlugin as LexicalLinkPlugin } from '@lexical/react/LexicalLinkPlugin'
import { ListPlugin } from '@lexical/react/LexicalListPlugin'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { TabIndentationPlugin } from '@lexical/react/LexicalTabIndentationPlugin'
import classNames from 'classnames'
import { $getRoot, Klass, LexicalNode } from 'lexical'
import * as Mdast from 'mdast'
import { ToMarkdownExtension, ToMarkdownOptions } from 'mdast-util-mdx'
import React from 'react'
import { theme as contentTheme } from '../content/theme'
import { LexicalConvertOptions, LexicalExportVisitor, defaultExtensions, defaultLexicalVisitors, defaultToMarkdownOptions } from '../export'
import { FromMarkdownOptions, ParseOptions } from 'mdast-util-from-markdown/lib'
import {
  MdastExtension,
  MdastImportVisitor,
  SyntaxExtension,
  defaultLexicalNodes,
  defaultMdastExtensions,
  defaultMdastVisitors,
  defaultSyntaxExtensions,
  importMarkdownToLexical
} from '../import'
import { EditorSystemComponent, useEmitterValues, usePublisher } from '../system/EditorSystemComponent'
import { SandpackConfig } from '../system/Sandpack'
import { NodeDecoratorComponents } from '../types/ExtendedEditorConfig'
import { JsxComponentDescriptor } from '../types/JsxComponentDescriptors'
import { ViewMode } from '../types/ViewMode'
import { LinkDialogPlugin } from './LinkDialogPlugin'
import ListMaxIndentLevelPlugin from './ListIndentPlugin'
import { PatchedMarkdownShortcutPlugin } from './MarkdownShortcutPlugin'
import { SharedHistoryPlugin } from './SharedHistoryPlugin'
import { ViewModeToggler } from './SourcePlugin'
import { ToolbarPlugin } from './ToolbarPlugin'
import {
  BlockTypeSelect,
  BoldItalicUnderlineButtons,
  CodeBlockButton,
  CodeFormattingButton,
  FrontmatterButton,
  HorizontalRuleButton,
  ImageButton,
  LinkButton,
  ListButtons,
  SandpackButton,
  TableButton,
  ToolbarSeparator
} from './ToolbarPlugin/toolbarComponents'
import styles from './styles.module.css'
import { CustomLeafDirectiveEditor } from '../types/NodeDecoratorsProps'

/**
 * Options that control how the the markdown input string is parsed into a tree.
 * @see {@link https://github.com/syntax-tree/mdast-util-from-markdown | fromMarkdown}
 */
export interface MarkdownParseOptions {
  /**
   * The visitors to process the markdown AST with.
   */
  visitors?: MdastImportVisitor<Mdast.Content>[]
  /**
   * The extensions to use for the markdown parser. Passed as the `extensions` option to the `fromMarkdown` function.
   */
  syntaxExtensions?: NonNullable<ParseOptions['extensions']>
  /**
   * The mdast extensions to use for the markdown parser. Passed as the `mdastExtensions` option to the `fromMarkdown` function.
   */
  mdastExtensions?: NonNullable<FromMarkdownOptions['mdastExtensions']>
}

/**
 * The properties of the {@link MDXEditor} react component
 */
export interface MDXEditorProps {
  /**
   * The markdown content to be edited.
   * Notice: this is the initial value of the editor.
   * If you want to change the value of the editor, use the `setMarkdown` method.
   */
  markdown: string
  /**
   * The configuration for the sandpack editor that's used for the fenced code blocks.
   * @see the {@link SandpackConfig} interface for more details.
   */
  sandpackConfig?: SandpackConfig
  /**
   * The markdown content to use for the diff view mode. If not provided, the contents of the `markdown` prop will be used.
   */
  headMarkdown?: string
  /**
   * The configuration for the JSX components used in the markdown content.
   * @see the {@link JsxComponentDescriptor} interface for more details.
   */
  jsxComponentDescriptors?: JsxComponentDescriptor[]
  /**
   * The list of suggestions to be shown in the link autocomplete dialog dropdown.
   */
  linkAutocompleteSuggestions?: string[]
  /**
   * The list of suggestions to be shown in the image autocomplete dialog dropdown.
   */
  imageAutoCompleteSuggestions?: string[]
  /**
   * The set of components to be rendered in the toolbar.
   */
  toolbarComponents?: React.ComponentType[]
  /**
   * The initial view mode for the editor. Defaults to `ViewMode.editor`.
   */
  viewMode?: ViewMode
  /**
   * Triggered when the markdown content changes.
   */
  onChange?: (markdown: string) => void
  /**
   * The CSS class name to be applied to the wrapper element of the component.
   */
  className?: string
  /**
   * The CSS class name to be applied to the content editable element.
   */
  contentEditableClassName?: string
  /**
   * The options to be used when parsing the markdown content.
   * @see the {@link MarkdownParseOptions} interface for more details.
   */
  markdownParseOptions?: MarkdownParseOptions
  /**
   * The {@link https://lexical.dev/ | Lexical nodes} used by the editor.
   */
  lexicalNodes?: Klass<LexicalNode>[]
  /**
   * The options used when converting the lexical tree to markdown.
   * @see the {@link LexicalConvertOptions} interface for more details.
   */
  lexicalConvertOptions?: LexicalConvertOptions
  /**
   * The supported code block languages.
   */
  codeBlockLanguages?: Record<string, string>
  /**
   * Implement this so that users can drag and drop or paste images into the editor.
   * Pass an implementation that takes a file as an argument, and returns Promise<string>, where string is the url of the image to be inserted.
   * @example
   * ```
   *async function imageUploadHandler(image: File) {
   *  const formData = new FormData()
   *  formData.append('image', image)
   *  const response = await fetch('/uploads/new', { method: 'POST', body: formData })
   *  const json = (await response.json()) as { url: string }
   *  return json.url
   *}
   * ```
   */
  imageUploadHandler?: (image: File) => Promise<string>
  customLeafDirectiveEditors?: CustomLeafDirectiveEditor<any>[]
}

const LazyJsxEditor = React.lazy(() => import('./NodeDecorators/JsxEditor').then((module) => ({ default: module.JsxEditor })))

const LazyLeafDirectiveEditor = React.lazy(() =>
  import('./NodeDecorators/LeafDirectiveEditor').then((module) => ({ default: module.LeafDirectiveEditor }))
)

const defaultNodeDecorators: NodeDecoratorComponents = {
  JsxEditor: LazyJsxEditor,
  LeafDirectiveEditor: LazyLeafDirectiveEditor
}

const defaultToolbarComponents = [
  BoldItalicUnderlineButtons,
  ToolbarSeparator,

  CodeFormattingButton,
  ToolbarSeparator,

  ListButtons,
  ToolbarSeparator,
  BlockTypeSelect,
  ToolbarSeparator,
  LinkButton,
  ImageButton,
  TableButton,
  HorizontalRuleButton,
  FrontmatterButton,

  ToolbarSeparator,

  CodeBlockButton,
  SandpackButton
]

const defaultSandpackConfig: SandpackConfig = {
  defaultPreset: 'react',
  presets: [
    {
      name: 'react',
      meta: 'live react',
      label: 'React',
      sandpackTemplate: 'react',
      sandpackTheme: 'light',
      snippetFileName: '/App.js',
      snippetLanguage: 'jsx',
      initialSnippetContent: `
export default function App() {
  return (
    <div className="App">
      <h1>Hello CodeSandbox</h1>
      <h2>Start editing to see some magic happen!</h2>
    </div>
  );
}
`.trim()
    }
  ]
}

/**
 * A structure that holds the default values for the options used in the markdown import/export steps.
 *
 * Most options are exported as records, so that you can pick a specific value using its name rather than its index which can change.
 * The actual MDXEditor props accept arrays, so you should use the `Object.values` function to convert the records to arrays.
 */
export type DefaultMdxOptionValues = {
  /** The default values for the options used in the import step */
  markdownParse: {
    defaultVisitors: Record<string, MdastImportVisitor<Mdast.Content>>
    defaultSyntaxExtensions: Record<string, SyntaxExtension>
    defaultMdastExtensions: Record<string, MdastExtension>
  }
  /** The default values for the options used in the markdown export step */
  lexicalConvert: {
    defaultVisitors: Record<string, LexicalExportVisitor<LexicalNode, Mdast.Content>>
    defaultExtensions: Record<string, ToMarkdownExtension>
    defaultMarkdownOptions: ToMarkdownOptions
  }
  /** The default lexical nodes used by the underlying Lexical framework */
  defaultLexicalNodes: typeof defaultLexicalNodes
}

/**
 * Exports the default values for the options used in the markdown import/export steps.
 */
export const defaultMdxOptionValues: DefaultMdxOptionValues = {
  markdownParse: {
    defaultVisitors: defaultMdastVisitors,
    defaultSyntaxExtensions,
    defaultMdastExtensions
  },
  lexicalConvert: {
    defaultVisitors: defaultLexicalVisitors,
    defaultExtensions,
    defaultMarkdownOptions: defaultToMarkdownOptions
  },
  defaultLexicalNodes
} as const

/**
 * The interface for the {@link MDXEditor} object reference.
 *
 * @example
 * ```tsx
 *  const mdxEditorRef = React.useRef<MDXEditorMethods>(null)
 *  <MDXEditor ref={mdxEditorRef} />
 * ```
 */
export interface MDXEditorMethods {
  /**
   * Gets the current markdown value.
   */
  getMarkdown: () => string

  /**
   * Updates the markdown value of the editor.
   */
  setMarkdown: (value: string) => void
}

/**
 * The MDXEditor React component. See {@link MDXEditorProps} for the list of available props and the {@link MDXEditorMethods} for the methods exposed through the ref.
 */
export const MDXEditor = React.forwardRef<MDXEditorMethods, MDXEditorProps>(
  (
    {
      markdown,
      headMarkdown,
      jsxComponentDescriptors = [],
      sandpackConfig = defaultSandpackConfig,
      onChange,
      viewMode,
      linkAutocompleteSuggestions,
      imageAutoCompleteSuggestions,
      className,
      contentEditableClassName,
      toolbarComponents = defaultToolbarComponents,
      imageUploadHandler,
      markdownParseOptions: {
        syntaxExtensions = Object.values(defaultSyntaxExtensions),
        mdastExtensions = Object.values(defaultMdastExtensions),
        visitors: importVisitors = Object.values(defaultMdastVisitors)
      } = {},
      lexicalConvertOptions: {
        toMarkdownExtensions = Object.values(defaultExtensions),
        toMarkdownOptions = defaultToMarkdownOptions,
        visitors: exportVisitors = Object.values(defaultLexicalVisitors)
      } = {},
      lexicalNodes = Object.values(defaultLexicalNodes),
      customLeafDirectiveEditors = []
    },
    ref
  ) => {
    const editorRootElementRef = React.useRef<HTMLDivElement>(null)
    return (
      <div className={classNames(styles.editorRoot, styles.editorWrapper, className)} ref={editorRootElementRef}>
        <LexicalComposer
          initialConfig={{
            editorState: () => {
              importMarkdownToLexical({
                root: $getRoot(),
                visitors: importVisitors,
                mdastExtensions,
                markdown,
                syntaxExtensions
              })
            },
            namespace: 'MDXEditor',
            theme: {
              ...contentTheme,
              nodeDecoratorComponents: defaultNodeDecorators
            },
            nodes: lexicalNodes,
            onError: (error: Error) => {
              throw error
            }
          }}
        >
          <EditorSystemComponent
            markdownSource={markdown}
            headMarkdown={headMarkdown || markdown}
            jsxComponentDescriptors={jsxComponentDescriptors}
            sandpackConfig={sandpackConfig}
            onChange={onChange}
            viewMode={viewMode}
            linkAutocompleteSuggestions={linkAutocompleteSuggestions}
            imageAutocompleteSuggestions={imageAutoCompleteSuggestions}
            editorRootElementRef={editorRootElementRef as any}
            toolbarComponents={toolbarComponents}
            markdownParseOptions={{
              visitors: importVisitors,
              mdastExtensions,
              syntaxExtensions
            }}
            lexicalConvertOptions={{
              visitors: exportVisitors,
              toMarkdownOptions: toMarkdownOptions,
              toMarkdownExtensions: toMarkdownExtensions
            }}
            lexicalNodes={lexicalNodes}
            imageUploadHandler={imageUploadHandler}
            customLeafDirectiveEditors={customLeafDirectiveEditors}
          >
            <ToolbarPlugin />
            <ViewModeToggler>
              <RichTextPlugin
                contentEditable={<ContentEditable className={classNames(styles.contentEditable, contentEditableClassName)} />}
                placeholder={<div></div>}
                ErrorBoundary={LexicalErrorBoundary}
              />
            </ViewModeToggler>
            <LexicalLinkPlugin />
            <HorizontalRulePlugin />
            <ListPlugin />
            <ListMaxIndentLevelPlugin maxDepth={7} />
            <TabIndentationPlugin />
            <LinkDialogPlugin />
            <SharedHistoryPlugin />
            <PatchedMarkdownShortcutPlugin />
            <MDXMethods mdxRef={ref} />
          </EditorSystemComponent>
        </LexicalComposer>
      </div>
    )
  }
)

const MDXMethods: React.FC<{ mdxRef: React.ForwardedRef<MDXEditorMethods> }> = ({ mdxRef }) => {
  const [markdownSource] = useEmitterValues('markdownSource')
  const setMarkdown = usePublisher('setMarkdown')

  React.useImperativeHandle(
    mdxRef,
    () => {
      return {
        getMarkdown: () => {
          return markdownSource
        },
        setMarkdown
      }
    },
    [markdownSource, setMarkdown]
  )
  return null
}
