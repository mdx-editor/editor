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
import { importMarkdownToLexical, UsedLexicalNodes } from '../'
import { LinkDialogPlugin } from '../'

const initialMarkdown = `
[A link](https://google.com/ "Link To Google")

In commodo tempor lorem, id lobortis purus pharetra nec. Morbi sagittis ultricies lectus ut placerat. Praesent vestibulum ligula non sapien efficitur, sit amet viverra est imperdiet. Nam rutrum massa quam, sit amet convallis erat viverra nec. Donec pharetra urna urna, non malesuada orci consequat cursus. Nulla blandit ligula ac leo dictum fermentum. Fusce augue purus, dignissim ut posuere gravida, laoreet eget quam. Nunc porttitor leo sem, eget posuere magna congue ut. Nunc tempus mi quis efficitur accumsan. Ut efficitur, felis eu lacinia finibus, nisl quam ultrices eros, eget scelerisque dolor diam nec turpis. Nam ultricies, sapien auctor condimentum bibendum, metus est maximus neque, id ornare metus eros quis libero. Nulla facilisi.

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

export function BasicSetup() {
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
      <RichTextPlugin
        contentEditable={<ContentEditable className="EditorContentEditable" />}
        placeholder={<div></div>}
        ErrorBoundary={LexicalErrorBoundary}
      />
      <LexicalLinkPlugin />
      <ListPlugin />
      <LinkDialogPlugin />
    </LexicalComposer>
  )
}
