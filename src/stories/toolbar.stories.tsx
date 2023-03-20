/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/**
 * @typedef {import('mdast-util-mdx')}
 */
import React from 'react'

import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { LinkPlugin as LexicalLinkPlugin } from '@lexical/react/LexicalLinkPlugin'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary'
import { ListPlugin } from '@lexical/react/LexicalListPlugin'
import { LinkDialogPlugin, SandpackConfigContext, ToolbarPlugin } from '../'
import { HorizontalRulePlugin } from '@lexical/react/LexicalHorizontalRulePlugin'
import initialMarkdown from './assets/kitchen-sink-markdown.md?raw'
import codeBlocksMarkdown from './assets/code-blocks-markdown.md?raw'
import { CodeHighlightPlugin, MarkdownResult, sandpackConfig, standardConfig } from './boilerplate'
import { TRANSFORMERS } from '@lexical/markdown'
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin'

export function ToolbarKitchenSink() {
  return (
    <LexicalComposer initialConfig={standardConfig(initialMarkdown)}>
      <ToolbarPlugin />
      <RichTextPlugin
        contentEditable={<ContentEditable className="EditorContentEditable" />}
        placeholder={<div></div>}
        ErrorBoundary={LexicalErrorBoundary}
      />
      <LexicalLinkPlugin />
      <HorizontalRulePlugin />
      <ListPlugin />
      <LinkDialogPlugin />
      <MarkdownResult initialCode={initialMarkdown} />
    </LexicalComposer>
  )
}

export function ToolbarWithCode() {
  return (
    <SandpackConfigContext.Provider value={sandpackConfig}>
      <LexicalComposer initialConfig={standardConfig(codeBlocksMarkdown)}>
        <ToolbarPlugin />
        <RichTextPlugin contentEditable={<ContentEditable />} placeholder={<div></div>} ErrorBoundary={LexicalErrorBoundary} />
        <LexicalLinkPlugin />
        <HorizontalRulePlugin />
        <ListPlugin />
        <CodeHighlightPlugin />
        <LinkDialogPlugin />
        <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
        <MarkdownResult initialCode={codeBlocksMarkdown} />
      </LexicalComposer>
    </SandpackConfigContext.Provider>
  )
}
