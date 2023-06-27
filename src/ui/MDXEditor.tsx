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
import React from 'react'
import { theme as contentTheme } from '../content/theme'
import { defaultLexicalVisitors } from '../export'
import { ExportMarkdownFromLexicalOptions, defaultExtensions, defaultToMarkdownOptions } from '../export/export'
import {
  MarkdownParseOptions,
  defaultLexicalNodes,
  defaultMdastExtensions,
  defaultMdastVisitors,
  defaultSyntaxExtensions,
  importMarkdownToLexical,
} from '../import'
import { EditorSystemComponent, useEmitterValues } from '../system/EditorSystemComponent'
import { SandpackConfig } from '../system/Sandpack'
import { JsxComponentDescriptors } from '../types/JsxComponentDescriptors'
import { ViewMode } from '../types/ViewMode'
import { LinkDialogPlugin } from './LinkDialogPlugin'
import ListMaxIndentLevelPlugin from './ListIndentPlugin'
import { PatchedMarkdownShortcutPlugin } from './MarkdownShortcutPlugin'
import { CodeBlockEditor } from './NodeDecorators/CodeBlockEditor'
import { FrontmatterEditor } from './NodeDecorators/FrontmatterEditor'
import { JsxEditor } from './NodeDecorators/JsxEditor'
import { SandpackEditor } from './NodeDecorators/SandpackEditor'
import { TableEditor } from './NodeDecorators/TableEditor'
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
  ToolbarSeparator,
} from './ToolbarPlugin/toolbarComponents'
import styles from './styles.module.css'
import { NodeDecoratorComponents } from '../types/ExtendedEditorConfig'

/**
 * MDXEditor is a rich text editor React Component for editing markdown.
 */
export interface MDXEditorProps {
  /**
   * The markdown content to be edited.
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
   * @see the {@link JsxComponentDescriptors} interface for more details.
   */
  jsxComponentDescriptors?: JsxComponentDescriptors
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
  onChange?: (markdown: string) => void
  className?: string
  contentEditableClassName?: string
  markdownParseOptions?: {
    syntaxExtensions?: MarkdownParseOptions['syntaxExtensions']
    mdastExtensions?: MarkdownParseOptions['mdastExtensions']
    visitors?: MarkdownParseOptions['visitors']
  }
  lexicalNodes?: Klass<LexicalNode>[]
  lexicalConvertOptions?: {
    extensions?: ExportMarkdownFromLexicalOptions['toMarkdownExtensions']
    markdownOptions?: ExportMarkdownFromLexicalOptions['toMarkdownOptions']
    visitors?: ExportMarkdownFromLexicalOptions['visitors']
  }
}

const defaultNodeDecorators: NodeDecoratorComponents = {
  FrontmatterEditor,
  JsxEditor,
  SandpackEditor,
  CodeBlockEditor,
  TableEditor,
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
  SandpackButton,
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
`.trim(),
    },
  ],
}

// insert CM code block type rather than the default one

export interface DefaultMdxOptionValues {
  markdownParse: {
    defaultVisitors: typeof defaultMdastVisitors
    defaultSyntaxExtensions: typeof defaultSyntaxExtensions
    defaultMdastExtensions: typeof defaultMdastExtensions
  }
  lexicalConvert: {
    defaultVisitors: typeof defaultLexicalVisitors
    defaultExtensions: typeof defaultExtensions
    defaultMarkdownOptions: typeof defaultToMarkdownOptions
  }
  defaultLexicalNodes: typeof defaultLexicalNodes
}

export const defaultMdxOptionValues: DefaultMdxOptionValues = {
  markdownParse: {
    defaultVisitors: defaultMdastVisitors,
    defaultSyntaxExtensions,
    defaultMdastExtensions,
  },
  lexicalConvert: {
    defaultVisitors: defaultLexicalVisitors,
    defaultExtensions,
    defaultMarkdownOptions: defaultToMarkdownOptions,
  },
  defaultLexicalNodes,
}

export interface MDXEditorMethods {
  getMarkdown: () => string
}

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
      markdownParseOptions: {
        syntaxExtensions = Object.values(defaultSyntaxExtensions),
        mdastExtensions = Object.values(defaultMdastExtensions),
        visitors: importVisitors = Object.values(defaultMdastVisitors),
      } = {},
      lexicalConvertOptions: {
        extensions: toMarkdownExtensions = Object.values(defaultExtensions),
        markdownOptions: toMarkdownOptions = defaultToMarkdownOptions,
        visitors: exportVisitors = Object.values(defaultLexicalVisitors),
      } = {},
      lexicalNodes = Object.values(defaultLexicalNodes),
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
                syntaxExtensions,
              })
            },
            namespace: 'MDXEditor',
            theme: {
              ...contentTheme,
              nodeDecoratorComponents: defaultNodeDecorators,
            },
            nodes: lexicalNodes,
            onError: (error: Error) => console.error(error),
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
              syntaxExtensions,
            }}
            lexicalConvertOptions={{
              visitors: exportVisitors,
              toMarkdownOptions: toMarkdownOptions,
              toMarkdownExtensions: toMarkdownExtensions,
            }}
            lexicalNodes={lexicalNodes}
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

  React.useImperativeHandle(
    mdxRef,
    () => {
      return {
        getMarkdown: () => {
          return markdownSource
        },
      }
    },
    [markdownSource]
  )
  return null
}
