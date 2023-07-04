/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/**
 * @typedef {import('mdast-util-mdx')}
 */
import React from 'react'
import './rawContents.d.ts'
import codeBlocksMarkdown from './assets/code-blocks-markdown.md?raw'
import initialMarkdown from './assets/kitchen-sink-markdown.md?raw'
import jsxMarkdown from './assets/jsx.md?raw'
import admonitionMarkdown from './assets/admonition-markdown.md?raw'
import styles from './styles.module.css'

import { WrappedLexicalEditor } from './boilerplate'
import { MDXEditor, MDXEditorMethods } from '../'

export function A1MarkdownKitchenSink() {
  return <WrappedLexicalEditor markdown={initialMarkdown} />
}

export function A3CodeBlocks() {
  return <WrappedLexicalEditor markdown={codeBlocksMarkdown} />
}

export function A4JSX() {
  return <WrappedLexicalEditor onChange={(markdown) => console.log(markdown)} markdown={jsxMarkdown} />
}

export function A5Admonitions() {
  return <WrappedLexicalEditor markdown={admonitionMarkdown} />
}

export function DiffMode() {
  return <WrappedLexicalEditor markdown={initialMarkdown} viewMode="diff" />
}

export function Whitespace() {
  const markdown = '**so&#x20;**'
  return <WrappedLexicalEditor markdown={markdown} />
}

export function CustomColors() {
  return <WrappedLexicalEditor markdown={initialMarkdown} className={styles.customEditorRoot} />
}

export function DarkMode() {
  return <WrappedLexicalEditor markdown={initialMarkdown} className={'dark-theme'} />
}

export function GetValueWithButton() {
  const ref = React.useRef<MDXEditorMethods>(null)

  return (
    <div>
      <button onClick={() => console.log(ref.current?.getMarkdown())}>Get Markdown</button>
      <MDXEditor markdown={initialMarkdown} ref={ref} />
    </div>
  )
}
