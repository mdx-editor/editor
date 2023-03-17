/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/**
 * @typedef {import('mdast-util-mdx')}
 */
import { $getRoot, EditorState } from 'lexical'
import React, { useCallback, useEffect, useState } from 'react'
import './rawContents.d.ts'

import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { LinkPlugin as LexicalLinkPlugin } from '@lexical/react/LexicalLinkPlugin'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { TabIndentationPlugin } from '@lexical/react/LexicalTabIndentationPlugin'

import { TRANSFORMERS } from '@lexical/markdown'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary'
import { ListPlugin } from '@lexical/react/LexicalListPlugin'
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin'
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin'

import { exportMarkdownFromLexical, SandpackConfigContext } from '../'

import codeBlocksMarkdown from './assets/code-blocks-markdown.md?raw'
import initialMarkdown from './assets/kitchen-sink-markdown.md?raw'
import { sandpackConfig, standardConfig } from './boilerplate'

function convertLexicalStateToMarkdown(state: EditorState) {
  return new Promise<string>((resolve) => {
    state.read(() => {
      resolve(exportMarkdownFromLexical($getRoot()))
    })
  })
}

function MarkdownResult({ initialCode }: { initialCode: string }) {
  const [editor] = useLexicalComposerContext()
  const [outMarkdown, setOutMarkdown] = useState('')
  useEffect(() => {
    convertLexicalStateToMarkdown(editor.getEditorState())
      .then((markdown) => {
        setOutMarkdown(markdown)
      })
      .catch((rejection) => console.warn({ rejection }))
  })

  const onChange = useCallback(() => {
    convertLexicalStateToMarkdown(editor.getEditorState())
      .then((markdown) => {
        setOutMarkdown(markdown)
      })
      .catch((rejection) => console.warn({ rejection }))
  }, [editor])

  return (
    <>
      <div style={{ display: 'flex', height: 400, overflow: 'auto' }}>
        <div style={{ flex: 1 }}>
          <h3>Result markdown</h3>
          <OnChangePlugin onChange={onChange} />

          <code>
            <pre>{outMarkdown.trim()}</pre>
          </code>
        </div>
        <div style={{ flex: 1 }}>
          <h3>Initial markdown</h3>
          <code>
            <pre>{initialCode.trim()}</pre>
          </code>
        </div>
      </div>
    </>
  )
}

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
