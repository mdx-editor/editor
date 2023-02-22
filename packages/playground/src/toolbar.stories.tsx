/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/**
 * @typedef {import('mdast-util-mdx')}
 */
import React from 'react'
import { $getRoot } from 'lexical'

import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { LinkPlugin as LexicalLinkPlugin } from '@lexical/react/LexicalLinkPlugin'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary'
import { ListPlugin } from '@lexical/react/LexicalListPlugin'
import { importMarkdownToLexical, UsedLexicalNodes } from '@virtuoso.dev/lexical-mdx-import-export'
import { LinkPopupPlugin, ToolbarPlugin } from '@virtuoso.dev/lexical-editor-ui'

const initialMarkdown = `
[A link](https://google.com/ "Link To Google")

In commodo tempor lorem, id lobortis purus pharetra nec. Morbi sagittis ultricies lectus ut placerat. 

[A link](https://google.com/ "Link To Google")

# Heading 1

## Heading 2

* Bullet 1
* Bullet 2

1. Numbered 1
2. Numbered 2

In commodo tempor lorem, id lobortis purus pharetra nec. Morbi sagittis ultricies lectus ut placerat. 

### Sandpack code

\`\`\`js
export default function App() {
  return <h1>Hello world from a markdown</h1>
}
\`\`\`

[A link](https://google.com/ "Link To Google")
In commodo tempor lorem, id lobortis purus pharetra nec. Morbi sagittis ultricies lectus ut placerat. 
In commodo tempor lorem, id lobortis purus pharetra nec. Morbi sagittis ultricies lectus ut placerat. 
In commodo tempor lorem, id lobortis purus pharetra nec. Morbi sagittis ultricies lectus ut placerat. 

[A link](https://google.com/ "Link To Google")

[A link](https://google.com/ "Link To Google")

[A link](https://google.com/ "Link To Google")
`

const theme = {
  text: {
    bold: 'PlaygroundEditorTheme__textBold',
    code: 'PlaygroundEditorTheme__textCode',
    italic: 'PlaygroundEditorTheme__textItalic',
    strikethrough: 'PlaygroundEditorTheme__textStrikethrough',
    subscript: 'PlaygroundEditorTheme__textSubscript',
    superscript: 'PlaygroundEditorTheme__textSuperscript',
    underline: 'PlaygroundEditorTheme__textUnderline',
    underlineStrikethrough: 'PlaygroundEditorTheme__textUnderlineStrikethrough',
  },

  list: {
    nested: {
      listitem: 'PlaygroundEditorTheme__nestedListItem',
    },
  },
}

function onError(error: Error) {
  console.error(error)
}

export function ToolbarKitchenSink() {
  const initialConfig = {
    editorState: () => {
      importMarkdownToLexical($getRoot(), initialMarkdown)
    },
    namespace: 'MyEditor',
    theme,
    nodes: UsedLexicalNodes,
    onError,
  }

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <ToolbarPlugin />
      <RichTextPlugin
        contentEditable={<ContentEditable className="EditorContentEditable" />}
        placeholder={<div></div>}
        ErrorBoundary={LexicalErrorBoundary}
      />
      <LexicalLinkPlugin />
      <ListPlugin />
      <LinkPopupPlugin />
    </LexicalComposer>
  )
}
