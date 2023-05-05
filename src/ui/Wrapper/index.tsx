/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary'
import { HorizontalRulePlugin } from '@lexical/react/LexicalHorizontalRulePlugin'
import { LinkPlugin as LexicalLinkPlugin } from '@lexical/react/LexicalLinkPlugin'
import { ListPlugin } from '@lexical/react/LexicalListPlugin'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { $getRoot } from 'lexical'
import React from 'react'
import {
  contentTheme,
  importMarkdownToLexical,
  JsxComponentDescriptors,
  LinkDialogPlugin,
  ToolbarPlugin,
  UsedLexicalNodes,
  useEmitterValues,
  ViewModeToggler,
} from '../../'
import { EditorSystemComponent } from '../../system'
import { SandpackConfigValue } from '../../system/Sandpack'
import { NodeDecorators } from '../../system/NodeDecorators'
import { FrontmatterEditor } from '../NodeDecorators/FrontmatterEditor'
import { JsxEditor } from '../NodeDecorators/JsxEditor'
import { SandpackEditor } from '../NodeDecorators/SandpackEditor'
import { TRANSFORMERS } from '@lexical/markdown'
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin'
import { CodeBlockEditor } from '../NodeDecorators/CodeBlockEditor'

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
  onChange?: (markdown: string) => void
}

const nodeDecorators: NodeDecorators = {
  FrontmatterEditor,
  JsxEditor,
  SandpackEditor,
  CodeBlockEditor,
}

export const Wrapper: React.FC<WrappedEditorProps> = ({ markdown, headMarkdown, jsxComponentDescriptors, sandpackConfig, onChange }) => {
  return (
    <div className="p-3 max-w-[90rem] border-slate-100 border-solid border-2">
      <LexicalComposer initialConfig={standardConfig(markdown)}>
        <EditorSystemComponent
          headMarkdown={headMarkdown}
          markdownSource={markdown}
          jsxComponentDescriptors={jsxComponentDescriptors}
          sandpackConfig={sandpackConfig}
          onChange={onChange}
          nodeDecorators={nodeDecorators}
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
          <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
        </EditorSystemComponent>
      </LexicalComposer>
    </div>
  )
}
