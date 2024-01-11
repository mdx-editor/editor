import React from 'react'
import {
  DiffSourceToggleWrapper,
  GenericJsxEditor,
  JsxComponentDescriptor,
  MDXEditor,
  MDXEditorMethods,
  diffSourcePlugin,
  headingsPlugin,
  insertMarkdown$,
  jsxPlugin,
  listsPlugin,
  tablePlugin,
  toolbarPlugin,
  usePublisher
} from '..'

const initialMarkdownContent = `
  # Hello World

  This is a dummy markdown content.
`

const simpleMarkdownContentToInsert = `
# Hello World

This is a dummy markdown content.

## Hello World 2

This is a dummy markdown content heading 2.
`

const complexMarkdownContentToInsert = `
### List

* hello
* world
  * indented
  * more
* back

1. more
2. more

* [x] Walk the dog
* [ ] Watch movie
* [ ] Have dinner with family

... an all empty list

* [ ] Walk the dog
* [ ] Watch movie
* [ ] Have dinner with family

### Table

| Syntax      | Description   | Profit |
| ----------- | ------------- | ------:|
| Header      | Title         | 50     |
| Paragraph   | Text *italic*   | 70     |
`

const jsxMarkdownContentToInsert = `
import { BlockNode } from './external';

<BlockNode foo="fooValue">
  Content *foo*

  more Content
</BlockNode>
`

export function InsertSimpleMarkdown() {
  return (
    <>
      <MDXEditor
        markdown={initialMarkdownContent}
        plugins={[
          headingsPlugin(),
          diffSourcePlugin({ viewMode: 'rich-text', diffMarkdown: 'boo' }),
          toolbarPlugin({
            toolbarContents: () => (
              <DiffSourceToggleWrapper>
                <InsertSimpleMarkdownButton />
              </DiffSourceToggleWrapper>
            )
          })
        ]}
        onChange={(md) => {
          console.log('change', md)
        }}
      />
    </>
  )
}

const InsertSimpleMarkdownButton = () => {
  const insertMarkdown = usePublisher(insertMarkdown$)

  return (
    <>
      <button
        onClick={() => {
          insertMarkdown(simpleMarkdownContentToInsert)
        }}
      >
        Insert markdown
      </button>
    </>
  )
}

export function InsertMarkdownWithTableAndList() {
  return (
    <>
      <MDXEditor
        markdown={initialMarkdownContent}
        plugins={[
          headingsPlugin(),
          listsPlugin(),
          diffSourcePlugin({ viewMode: 'rich-text', diffMarkdown: 'boo' }),
          tablePlugin(),
          toolbarPlugin({
            toolbarContents: () => (
              <DiffSourceToggleWrapper>
                <InsertComplexMarkdownButton />
              </DiffSourceToggleWrapper>
            )
          })
        ]}
        onChange={(md) => {
          console.log('change', md)
        }}
      />
    </>
  )
}

const InsertComplexMarkdownButton = () => {
  const insertMarkdown = usePublisher(insertMarkdown$)

  return (
    <>
      <button
        onClick={() => {
          insertMarkdown(complexMarkdownContentToInsert)
        }}
      >
        Insert markdown
      </button>
    </>
  )
}

const jsxComponentDescriptors: JsxComponentDescriptor[] = [
  {
    name: 'BlockNode',
    kind: 'flow',
    source: './external',
    props: [],
    hasChildren: true,
    Editor: GenericJsxEditor
  }
]

export function InsertMarkdownToNestedEditor() {
  const ref = React.useRef<MDXEditorMethods>(null)
  return (
    <>
      <button onClick={() => ref.current?.insertMarkdown(complexMarkdownContentToInsert)}>Insert new markdown</button>
      <button onClick={() => console.log(ref.current?.getMarkdown())}>Get markdown</button>

      <MDXEditor
        ref={ref}
        markdown={jsxMarkdownContentToInsert}
        onChange={console.log}
        plugins={[
          headingsPlugin(),
          listsPlugin(),
          tablePlugin(),
          jsxPlugin({ jsxComponentDescriptors }),
          diffSourcePlugin({ viewMode: 'rich-text', diffMarkdown: 'boo' })
        ]}
      />
    </>
  )
}
