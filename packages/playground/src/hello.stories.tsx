/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/**
 * @typedef {import('mdast-util-mdx')}
 */
import React from 'react'
import { $getRoot, EditorState } from 'lexical'
import { useCallback, useEffect, useState } from 'react'

import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { LinkPlugin as LexicalLinkPlugin } from '@lexical/react/LexicalLinkPlugin'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { TabIndentationPlugin } from '@lexical/react/LexicalTabIndentationPlugin'

import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin'
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { TRANSFORMERS } from '@lexical/markdown'
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin'
import { ListPlugin } from '@lexical/react/LexicalListPlugin'

import {
  exportMarkdownFromLexical,
  importMarkdownToLexical,
  UsedLexicalNodes,
  SandpackConfigContext,
  SandpackConfig,
} from '@virtuoso.dev/lexical-mdx-import-export'

const initialMarkdown = `---
title: Hello World
---

[A link](https://google.com/ "Googl Title")

horizontal rule

---------------

Block of code:

\`\`\`js
export default function App() {
  return <h1>Hello world from a markdown</h1>
}
\`\`\`

# Heading 1 

 - bullet 1 *italic*
 - bullet 2, **bold** some more text
    - nested bullet
    - nested bullet 2

1. Ordered bullet 1
2. Ordered bullet 2

World Some **nested *formatting* text some more <u>un *derl* ine</u>**.

And *some italic with nested **bold** text*.

> Quote with **bold** and *italic* text.
> and some more.

## Heading 2

\`inlineVariable\` code

[A link](https://google.com/ "Googl Title")

Image:

![Shiprock](https://web-dev.imgix.net/image/admin/OIF2VcXp8P6O7tQvw53B.jpg)
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

// Catch any errors that occur during Lexical updates and log them
// or throw them as needed. If you don't throw them, Lexical will
// try to recover gracefully without losing user data.
function onError(error: Error) {
  console.error(error)
}

function convertLexicalStateToMarkdown(state: EditorState) {
  return new Promise<string>((resolve) => {
    state.read(() => {
      resolve(exportMarkdownFromLexical($getRoot()))
    })
  })
}

function MarkdownResult({ initialCode }: { initialCode: string }) {
  const [editor] = useLexicalComposerContext()
  const [outMarkdown, setOutMarkdown] = useState('')
  useEffect(() => {
    convertLexicalStateToMarkdown(editor.getEditorState())
      .then((markdown) => {
        setOutMarkdown(markdown)
      })
      .catch((rejection) => console.warn({ rejection }))
  })

  const onChange = useCallback(() => {
    convertLexicalStateToMarkdown(editor.getEditorState())
      .then((markdown) => {
        setOutMarkdown(markdown)
      })
      .catch((rejection) => console.warn({ rejection }))
  }, [editor])

  return (
    <>
      <div style={{ display: 'flex', height: 400, overflow: 'auto' }}>
        <div style={{ flex: 1 }}>
          <h3>Result markdown</h3>
          <OnChangePlugin onChange={onChange} />

          <code>
            <pre>{outMarkdown.trim()}</pre>
          </code>
        </div>
        <div style={{ flex: 1 }}>
          <h3>Initial markdown</h3>
          <code>
            <pre>{initialCode.trim()}</pre>
          </code>
        </div>
      </div>
    </>
  )
}

export function BasicEditor() {
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
      <TabIndentationPlugin />
      <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
      <HistoryPlugin />
      <MarkdownResult initialCode={initialMarkdown} />
    </LexicalComposer>
  )
}

const codeBlocksMarkdown = `
Block of code:

\`\`\`js
export default function App() {
  return <h1>Hello world from a markdown</h1>
}
\`\`\`

Sandpack:

\`\`\`tsx live preset=virtuoso
import { Virtuoso } from 'react-virtuoso'
import { generateUsers } from './data'

export default function App() {
  return (
    <Virtuoso
      style={{ height: 400 }}
      data={generateUsers(100000)}
      itemContent={(index, user) => (
        <div
          style={{
            backgroundColor: user.bgColor,
            padding: '1rem 0.5rem',
          }}
        >
          <h4>{user.name}</h4>
          <div style={{ marginTop: '1rem' }}>{user.description}</div>
        </div>
      )}
    />
  )
}
\`\`\`

\`\`\`tsx live 
export default function App() {
  return <h1>Hello world from a markdown</h1>
}
\`\`\`
`

const dataCode = `
import faker from 'faker'
import { groupBy } from 'lodash'
import React from 'react'

const randomHeight = () => Math.floor(Math.random() * 30 + 24)

const generateRandomItems = (count) => {
  return Array.from({ length: count }).map((_, i) => ({
    text: \`Item \${i + 1}\`,
    height: randomHeight(),
    longText: faker.lorem.paragraphs(1),
  }))
}

const generated = []

export function toggleBg(index) {
  return index % 2 ? '#f5f5f5' : 'white'
}

export function user(index = 0) {
  let firstName = faker.name.firstName()
  let lastName = faker.name.lastName()

  return {
    index: index + 1,
    bgColor: toggleBg(index),
    name: \`\${firstName} $\{lastName}\`,
    initials: \`$\{firstName.substr(0, 1)}\${lastName.substr(0, 1)}\`,
    jobTitle: faker.name.jobTitle(),
    description: faker.lorem.sentence(10),
    longText: faker.lorem.paragraphs(1),
  }
}

export const getUser = (index) => {
  if (!generated[index]) {
    generated[index] = user(index)
  }

  return generated[index]
}

const userSorter = (a, b) => {
  if (a.name < b.name) {
    return -1
  }
  if (a.name > b.name) {
    return 1
  }
  return 0
}

export function generateUsers(length, startIndex = 0) {
  return Array.from({ length }).map((_, i) => getUser(i + startIndex))
}

export function generateGroupedUsers(length) {
  const users = Array.from({ length })
    .map((_, i) => getUser(i))
    .sort(userSorter)
  const groupedUsers = groupBy(users, (user) => user.name[0])
  const groupCounts = Object.values(groupedUsers).map((users) => users.length)
  const groups = Object.keys(groupedUsers)

  return { users, groupCounts, groups }
}

export const avatar = () =>
  React.createElement(
    'div',
    {
      style: {
        backgroundColor: 'blue',
        borderRadius: '50%',
        width: 50,
        height: 50,
        paddingTop: 15,
        paddingLeft: 15,
        color: 'white',
        boxSizing: 'border-box'
      },
    },
    "AB"
  )

export const avatarPlaceholder = (text = ' ') =>
  React.createElement(
    'div',
    {
      style: {
        backgroundColor: '#eef2f4',
        borderRadius: '50%',
        width: 50,
        height: 50,
      },
    },
    text
  )

const range = (len) => {
  const arr = []
  for (let i = 0; i < len; i++) {
    arr.push(i)
  }
  return arr
}

const newPerson = () => {
  const statusChance = Math.random()
  return {
    firstName: faker.name.firstName(),
    lastName: faker.name.lastName(),
    age: Math.floor(Math.random() * 30),
    visits: Math.floor(Math.random() * 100),
    progress: Math.floor(Math.random() * 100),
    status: statusChance > 0.66 ? 'relationship' : statusChance > 0.33 ? 'complicated' : 'single',
  }
}

export function makeData(...lens) {
  const makeDataLevel = (depth = 0) => {
    const len = lens[depth]
    return range(len).map((d) => {
      return {
        ...newPerson(),
        subRows: lens[depth + 1] ? makeDataLevel(depth + 1) : undefined,
      }
    })
  }

  return makeDataLevel()
}
`

const sandpackConfig: SandpackConfig = {
  defaultPreset: 'react',
  presets: [
    {
      name: 'react',
      sandpackTemplate: 'react',
      sandpackTheme: 'light',
      snippetFileName: '/App.js',
    },
    {
      name: 'virtuoso',
      sandpackTemplate: 'react-ts',
      sandpackTheme: 'light',
      snippetFileName: '/App.tsx',
      dependencies: {
        'react-virtuoso': 'latest',
        '@ngneat/falso': 'latest',
      },
      files: {
        './data.ts': dataCode,
      },
    },
  ],
}

export function CodeBlocks() {
  const initialConfig = {
    editorState: () => {
      importMarkdownToLexical($getRoot(), codeBlocksMarkdown)
    },
    namespace: 'MyEditor',
    theme,
    nodes: UsedLexicalNodes,
    onError,
  }

  return (
    <SandpackConfigContext.Provider value={sandpackConfig}>
      <LexicalComposer initialConfig={initialConfig}>
        <RichTextPlugin contentEditable={<ContentEditable />} placeholder={<div></div>} ErrorBoundary={LexicalErrorBoundary} />
        <LexicalLinkPlugin />
        <ListPlugin />
        <TabIndentationPlugin />
        <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
        <HistoryPlugin />
        <MarkdownResult initialCode={codeBlocksMarkdown} />
      </LexicalComposer>
    </SandpackConfigContext.Provider>
  )
}
