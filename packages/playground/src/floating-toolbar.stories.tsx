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
import { FloatingToolbarPlugin, LinkPopupPlugin } from '@virtuoso.dev/lexical-editor-ui'
import initialMarkdown from './assets/kitchen-sink-markdown.md?raw'
import { standardConfig } from './boilerplate'

export function BasicSetup() {
  return (
    <LexicalComposer initialConfig={standardConfig(initialMarkdown)}>
      <RichTextPlugin contentEditable={<ContentEditable />} placeholder={<div></div>} ErrorBoundary={LexicalErrorBoundary} />
      <LexicalLinkPlugin />
      <ListPlugin />
      <FloatingToolbarPlugin />
      <LinkPopupPlugin />
    </LexicalComposer>
  )
}
