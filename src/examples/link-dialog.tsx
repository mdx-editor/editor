import React from 'react'
import {
  MDXEditor,
  linkPlugin,
  linkDialogPlugin,
  AdmonitionDirectiveDescriptor,
  directivesPlugin,
  headingsPlugin,
  quotePlugin,
  listsPlugin
} from '../'
import admonitionMarkdown from './assets/admonition.md?raw'

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
        headingsPlugin(),
        quotePlugin(),
        directivesPlugin({ directiveDescriptors: [AdmonitionDirectiveDescriptor] }),
        listsPlugin(),
        linkPlugin(),
        linkDialogPlugin({ linkAutocompleteSuggestions: ['https://msn.com/', 'https://virtuoso.dev/'] })
      ]}
    />
  )
}

export function ParentOffsetOfAnchor() {
  return (
    <div style={{ position: 'relative', marginTop: '100px' }}>
      <MDXEditor
        onChange={console.log}
        markdown={`Hello world [link](https://google.com/)`}
        plugins={[linkPlugin(), linkDialogPlugin({ linkAutocompleteSuggestions: ['https://msn.com/', 'https://virtuoso.dev/'] })]}
      />
    </div>
  )
}
