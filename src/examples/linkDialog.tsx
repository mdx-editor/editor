import React from 'react'
import { MDXEditorCore, linkPlugin, linkDialogPlugin, AdmonitionDirectiveDescriptor, directivesPlugin } from '../'
import admonitionMarkdown from './assets/admonition.md?raw'

export function Basics() {
  return (
    <MDXEditorCore
      onChange={console.log}
      markdown={`Hello world [link](https://google.com/)`}
      plugins={[linkPlugin(), linkDialogPlugin({ linkAutocompleteSuggestions: ['https://msn.com/', 'https://virtuoso.dev/'] })]}
    />
  )
}

export function WithNestedEditors() {
  return (
    <MDXEditorCore
      onChange={console.log}
      markdown={admonitionMarkdown}
      plugins={[
        directivesPlugin({ directiveDescriptors: [AdmonitionDirectiveDescriptor] }),
        linkPlugin(),
        linkDialogPlugin({ linkAutocompleteSuggestions: ['https://msn.com/', 'https://virtuoso.dev/'] })
      ]}
    />
  )
}
