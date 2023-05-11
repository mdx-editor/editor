/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { CODE, ElementTransformer, Transformer, TRANSFORMERS } from '@lexical/markdown'
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { HorizontalRulePlugin } from '@lexical/react/LexicalHorizontalRulePlugin'
import { LinkPlugin as LexicalLinkPlugin } from '@lexical/react/LexicalLinkPlugin'
import { ListPlugin } from '@lexical/react/LexicalListPlugin'
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { $getRoot } from 'lexical'
import React from 'react'
import {
  $createCodeBlockNode,
  contentTheme,
  importMarkdownToLexical,
  JsxComponentDescriptors,
  LinkDialogPlugin,
  ToolbarPlugin,
  UsedLexicalNodes,
  ViewMode,
  ViewModeToggler,
} from '../../'
import { EditorSystemComponent } from '../../system'
import { NodeDecorators } from '../../system/NodeDecorators'
import { SandpackConfigValue } from '../../system/Sandpack'
import { CodeBlockEditor } from '../NodeDecorators/CodeBlockEditor'
import { FrontmatterEditor } from '../NodeDecorators/FrontmatterEditor'
import { JsxEditor } from '../NodeDecorators/JsxEditor'
import { SandpackEditor } from '../NodeDecorators/SandpackEditor'

export function standardConfig(markdown: string) {
  return {
    editorState: () => {
      importMarkdownToLexical($getRoot(), markdown)
    },
    namespace: 'MyEditor',
    theme: contentTheme,
    nodes: UsedLexicalNodes,
    onError: (error: Error) => console.error(error),
  }
}

interface WrappedEditorProps {
  markdown: string
  headMarkdown: string
  sandpackConfig: SandpackConfigValue
  jsxComponentDescriptors: JsxComponentDescriptors
  linkAutocompleteSuggestions?: string[]
  viewMode?: ViewMode
  onChange?: (markdown: string) => void
}

const nodeDecorators: NodeDecorators = {
  FrontmatterEditor,
  JsxEditor,
  SandpackEditor,
  CodeBlockEditor,
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

export const Wrapper: React.FC<WrappedEditorProps> = ({
  markdown,
  headMarkdown,
  jsxComponentDescriptors,
  sandpackConfig,
  onChange,
  viewMode,
  linkAutocompleteSuggestions,
}) => {
  return (
    <div className="p-3">
      <LexicalComposer initialConfig={standardConfig(markdown)}>
        <EditorSystemComponent
          headMarkdown={headMarkdown}
          markdownSource={markdown}
          jsxComponentDescriptors={jsxComponentDescriptors}
          sandpackConfig={sandpackConfig}
          onChange={onChange}
          viewMode={viewMode}
          nodeDecorators={nodeDecorators}
          linkAutocompleteSuggestions={linkAutocompleteSuggestions}
        >
          <ToolbarPlugin />
          <ViewModeToggler>
            <RichTextPlugin
              contentEditable={<ContentEditable className="prose font-sans max-w-none w-full focus:outline-none" />}
              placeholder={<div></div>}
              ErrorBoundary={LexicalErrorBoundary}
            />
          </ViewModeToggler>
          <LexicalLinkPlugin />
          <HorizontalRulePlugin />
          <ListPlugin />
          <LinkDialogPlugin />
          <HistoryPlugin />
          <MarkdownShortcutPlugin transformers={patchMarkdownTransformers(TRANSFORMERS)} />
        </EditorSystemComponent>
      </LexicalComposer>
    </div>
  )
}
