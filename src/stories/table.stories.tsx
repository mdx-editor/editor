import React from 'react'
import { WrappedLexicalEditor } from './boilerplate'
import tableMarkdown from './assets/table-markdown.md?raw'

export function Hello() {
  return <WrappedLexicalEditor markdown={tableMarkdown} />
}
