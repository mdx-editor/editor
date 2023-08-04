import React from 'react'
import { MDXEditor, linkPlugin, linkDialogPlugin, AdmonitionDirectiveDescriptor, directivesPlugin } from '../'
import admonitionMarkdown from './assets/live-demo-contents.md?raw'

export function Basics() {
  return (
    <MDXEditor
      onChange={console.log}
      markdown={`Hello world [link](https://google.com/)`}
      plugins={[linkPlugin(), linkDialogPlugin({ linkAutocompleteSuggestions: ['https://msn.com/', 'https://virtuoso.dev/'] })]}
    />
  )
}

export function WithNestedEditors() {
  return (
    <MDXEditor
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
