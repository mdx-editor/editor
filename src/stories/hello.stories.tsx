/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/**
 * @typedef {import('mdast-util-mdx')}
 */
import React from 'react'
import './rawContents.d.ts'

import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { LinkPlugin as LexicalLinkPlugin } from '@lexical/react/LexicalLinkPlugin'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { TabIndentationPlugin } from '@lexical/react/LexicalTabIndentationPlugin'

import { TRANSFORMERS } from '@lexical/markdown'
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary'
import { ListPlugin } from '@lexical/react/LexicalListPlugin'
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin'

import { SandpackConfigContext } from '../'

import codeBlocksMarkdown from './assets/code-blocks-markdown.md?raw'
import initialMarkdown from './assets/kitchen-sink-markdown.md?raw'
import { MarkdownResult, sandpackConfig, standardConfig } from './boilerplate'

export function BasicEditor() {
  return (
    <LexicalComposer initialConfig={standardConfig(initialMarkdown)}>
      <RichTextPlugin
        contentEditable={<ContentEditable className="EditorContentEditable" />}
        placeholder={<div></div>}
        ErrorBoundary={LexicalErrorBoundary}
      />
      <LexicalLinkPlugin />
      <ListPlugin />
      <TabIndentationPlugin />
      <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
      <HistoryPlugin />
      <MarkdownResult initialCode={initialMarkdown} />
    </LexicalComposer>
  )
}

export function CodeBlocks() {
  return (
    <SandpackConfigContext.Provider value={sandpackConfig}>
      <LexicalComposer initialConfig={standardConfig(initialMarkdown)}>
        <RichTextPlugin contentEditable={<ContentEditable />} placeholder={<div></div>} ErrorBoundary={LexicalErrorBoundary} />
        <LexicalLinkPlugin />
        <ListPlugin />
        <TabIndentationPlugin />
        <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
        <HistoryPlugin />
        <MarkdownResult initialCode={codeBlocksMarkdown} />
      </LexicalComposer>
    </SandpackConfigContext.Provider>
  )
}
