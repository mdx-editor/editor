/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { CODE, ElementTransformer, Transformer, TRANSFORMERS } from '@lexical/markdown'
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary'
import { HorizontalRulePlugin } from '@lexical/react/LexicalHorizontalRulePlugin'
import { LinkPlugin as LexicalLinkPlugin } from '@lexical/react/LexicalLinkPlugin'
import { ListPlugin } from '@lexical/react/LexicalListPlugin'
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { TabIndentationPlugin } from '@lexical/react/LexicalTabIndentationPlugin'
import classNames from 'classnames'
import { $getRoot } from 'lexical'
import React from 'react'
import { EditorSystemComponent } from '../system'
import { NodeDecorators } from '../system/NodeDecorators'
import { SandpackConfig } from '../system/Sandpack'
import ListMaxIndentLevelPlugin from './ListIndentPlugin'
import { CodeBlockEditor } from './NodeDecorators/CodeBlockEditor'
import { FrontmatterEditor } from './NodeDecorators/FrontmatterEditor'
import { JsxEditor } from './NodeDecorators/JsxEditor'
import { SandpackEditor } from './NodeDecorators/SandpackEditor'
import { TableEditor } from './NodeDecorators/TableEditor'
import styles from './styles.module.css'
import {
  BoldItalicUnderlineButtons,
  CodeBlockButton,
  CodeFormattingButton,
  FrontmatterButton,
  HorizontalRuleButton,
  LinkButton,
  ListButtons,
  SandpackButton,
  TableButton,
  ToolbarSeparator,
  BlockTypeSelect,
} from './ToolbarPlugin/toolbarComponents'
import { SharedHistoryPlugin } from './SharedHistoryPlugin'
import { importMarkdownToLexical, UsedLexicalNodes } from '../import'
import { theme as contentTheme } from '../content/theme'
import { JsxComponentDescriptors } from '../types/JsxComponentDescriptors'
import { ViewMode } from '../types/ViewMode'
import { $createCodeBlockNode } from '../nodes'
import { ToolbarPlugin } from './ToolbarPlugin'
import { ViewModeToggler } from './SourcePlugin'
import { LinkDialogPlugin } from './LinkDialogPlugin'

export function lexicalComposerConfig(markdown: string) {
  return {
    editorState: () => {
      importMarkdownToLexical($getRoot(), markdown)
    },
    namespace: 'MDXEditor',
    theme: contentTheme,
    nodes: UsedLexicalNodes,
    onError: (error: Error) => console.error(error),
  }
}

interface MDXEditorProps {
  markdown: string
  sandpackConfig?: SandpackConfig
  headMarkdown?: string
  jsxComponentDescriptors?: JsxComponentDescriptors
  linkAutocompleteSuggestions?: string[]
  toolbarComponents?: React.ComponentType[]
  viewMode?: ViewMode
  onChange?: (markdown: string) => void
  className?: string
  contentEditableClassName?: string
}

const defaultNodeDecorators: NodeDecorators = {
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
      defaultSnippetLanguage: 'jsx',
      defaultSnippetContent: `
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
function patchMarkdownTransformers(transformers: Transformer[]) {
  const codeTransformer = transformers.find((t) => t === CODE) as ElementTransformer

  codeTransformer.replace = (parentNode, _children, match) => {
    const codeBlockNode = $createCodeBlockNode({ code: '', language: match ? match[1] : '', meta: '' })
    parentNode.replace(codeBlockNode)
    setTimeout(() => codeBlockNode.select(), 80)
  }

  return transformers
}

export const MDXEditor: React.FC<MDXEditorProps> = ({
  markdown,
  headMarkdown,
  jsxComponentDescriptors = [],
  sandpackConfig = defaultSandpackConfig,
  onChange,
  viewMode,
  linkAutocompleteSuggestions,
  className,
  contentEditableClassName,
  toolbarComponents = defaultToolbarComponents,
}) => {
  const editorRootElementRef = React.useRef<HTMLDivElement>(null)
  return (
    <div className={classNames(styles.editorRoot, styles.editorWrapper, className)} ref={editorRootElementRef}>
      <LexicalComposer initialConfig={lexicalComposerConfig(markdown)}>
        <EditorSystemComponent
          markdownSource={markdown}
          headMarkdown={headMarkdown || markdown}
          jsxComponentDescriptors={jsxComponentDescriptors}
          sandpackConfig={sandpackConfig}
          onChange={onChange}
          viewMode={viewMode}
          nodeDecorators={defaultNodeDecorators}
          linkAutocompleteSuggestions={linkAutocompleteSuggestions}
          editorRootElementRef={editorRootElementRef as any}
          toolbarComponents={toolbarComponents}
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
          <MarkdownShortcutPlugin transformers={patchMarkdownTransformers(TRANSFORMERS)} />
        </EditorSystemComponent>
      </LexicalComposer>
    </div>
  )
}
