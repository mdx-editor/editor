/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/**
 * @typedef {import('mdast-util-mdx')}
 */
import React from 'react'
import './rawContents.d.ts'
import codeBlocksMarkdown from './assets/code-blocks-markdown.md?raw'
import initialMarkdown from './assets/kitchen-sink-markdown.md?raw'
import jsxMarkdown from './assets/jsx.md?raw'

import { WrappedLexicalEditor } from './boilerplate'

export function MarkdownKitchenSink() {
  return <WrappedLexicalEditor markdown={initialMarkdown} />
}

export function CodeBlocks() {
  return <WrappedLexicalEditor markdown={codeBlocksMarkdown} />
}

export function JSX() {
  return <WrappedLexicalEditor onChange={(markdown) => console.log(markdown)} markdown={jsxMarkdown} />
}

export function DiffMode() {
  return <WrappedLexicalEditor markdown={initialMarkdown} viewMode="diff" />
}
