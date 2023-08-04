import React from 'react'
import {
  AdmonitionDirectiveDescriptor,
  DirectiveDescriptor,
  GenericDirectiveEditor,
  MDXEditor,
  codeBlockPlugin,
  codeMirrorPlugin,
  directivesPlugin,
  headingsPlugin,
  linkPlugin,
  listsPlugin,
  markdownShortcutPlugin,
  quotePlugin
} from '../'
import { YoutubeDirectiveDescriptor } from './_boilerplate'

import admonitionMarkdown from './assets/admonition.md?raw'

const youtubeMarkdown = `
This should be an youtube video:

::youtube{#A5lXAKrttBU}
`

const GenericDirectiveDescriptor: DirectiveDescriptor = {
  name: 'directive',
  testNode() {
    return true
  },
  attributes: ['id'],
  hasChildren: true,
  Editor: GenericDirectiveEditor
}

export const Youtube: React.FC = () => {
  return <MDXEditor markdown={youtubeMarkdown} plugins={[directivesPlugin({ directiveDescriptors: [YoutubeDirectiveDescriptor] })]} />
}

const genericMarkdown = `
a text directive :d{#id} with some text.

::leaf[some content]{#meh}

text

:::block{#id}

Some **markdown**

:::
`

export const CatchAll: React.FC = () => {
  return <MDXEditor markdown={genericMarkdown} plugins={[directivesPlugin({ directiveDescriptors: [GenericDirectiveDescriptor] })]} />
}

export const Admonitions: React.FC = () => {
  return (
    <MDXEditor
      onChange={console.log}
      markdown={admonitionMarkdown}
      plugins={[
        directivesPlugin({ directiveDescriptors: [AdmonitionDirectiveDescriptor] }),
        linkPlugin(),
        listsPlugin(),
        headingsPlugin(),
        codeBlockPlugin(),
        quotePlugin(),
        markdownShortcutPlugin()
      ]}
    />
  )
}

const codeBlockInAdmonition = `
text

:::note
test

\`\`\`jsx
console.log("foo")
\`\`\`
:::

foo

\`\`\`jsx
console.log("foo")
\`\`\`

more markdown
`

export const AdmonitionsWithCodeBlocks: React.FC = () => {
  return (
    <MDXEditor
      onChange={console.log}
      markdown={codeBlockInAdmonition}
      plugins={[
        directivesPlugin({ directiveDescriptors: [AdmonitionDirectiveDescriptor] }),
        linkPlugin(),
        codeBlockPlugin(),
        codeMirrorPlugin({ codeBlockLanguages: { jsx: 'JavaScript' } })
      ]}
    />
  )
}
