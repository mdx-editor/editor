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
import { LinkDialogPlugin, ToolbarPlugin } from '../'
import { HorizontalRulePlugin } from '@lexical/react/LexicalHorizontalRulePlugin'
import initialMarkdown from './assets/kitchen-sink-markdown.md?raw'
import { standardConfig } from './boilerplate'

export function ToolbarKitchenSink() {
  return (
    <LexicalComposer initialConfig={standardConfig(initialMarkdown)}>
      <div style={{ display: 'flex' }}>
        <div style={{ flex: 0 }}>
          <br />
          <br />
          <br />
          <button style={{ fontFamily: 'monospace' }}>i</button>
          <button style={{ fontFamily: 'monospace' }}>C</button>
          <button style={{ fontFamily: 'monospace' }}>`</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 0 }}>
            <ToolbarPlugin />
          </div>
          <RichTextPlugin
            contentEditable={<ContentEditable className="EditorContentEditable" />}
            placeholder={<div></div>}
            ErrorBoundary={LexicalErrorBoundary}
          />
          <LexicalLinkPlugin />
          <HorizontalRulePlugin />
          <ListPlugin />
          <LinkDialogPlugin />
        </div>
      </div>
    </LexicalComposer>
  )
}
