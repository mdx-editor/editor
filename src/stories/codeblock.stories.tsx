/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/**
 * @typedef {import('mdast-util-mdx')}
 */
import React from 'react'
import './rawContents.d.ts'
import codeBlocksMarkdown from './assets/code-blocks-markdown.md?raw'
import { MDXEditor } from '../'
import { virtuosoSampleSandpackConfig } from './boilerplate.js'

export function MultiplePresets() {
  return <MDXEditor markdown={codeBlocksMarkdown} sandpackConfig={virtuosoSampleSandpackConfig} />
}
