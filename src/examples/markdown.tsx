import React from 'react'
import {
  DiffSourceToggleWrapper,
  MDXEditor,
  diffSourcePlugin,
  headingsPlugin,
  insertMarkdown$,
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

export function InsertSimpleMarkdown() {
  return (
    <>
      <MDXEditor
        markdown={initialMarkdownContent}
        plugins={[
          headingsPlugin(),
          diffSourcePlugin(),
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
          diffSourcePlugin(),
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
