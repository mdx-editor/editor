import React from 'react'
import { MdxJsxTextElement } from 'mdast-util-mdx'
import {
  Button,
  DiffSourceToggleWrapper,
  JsxComponentDescriptor,
  MDXEditor,
  NestedLexicalEditor,
  UndoRedo,
  diffSourcePlugin,
  insertJsx$,
  jsxPlugin,
  toolbarPlugin
} from '../'
import { usePublisher } from '@mdxeditor/gurx'
const jsxMarkdown = `<Grid foo="fooValue">
  Content *foo*more Content
  </Grid>`
const jsxComponentDescriptors: JsxComponentDescriptor[] = [
  {
    name: 'Card',
    kind: 'text',
    source: './external',
    props: [],
    hasChildren: true,
    Editor: () => {
      return <button>I am the card</button>
    }
  },
  {
    name: 'Grid',
    kind: 'flow',
    source: './external',
    props: [],
    hasChildren: true,
    Editor: () => {
      return (
        <div style={{ border: '1px solid red' }}>
          <NestedLexicalEditor<MdxJsxTextElement>
            block
            getContent={(node) => node.children}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            getUpdatedMdastNode={(mdastNode, children: any) => {
              return {
                ...mdastNode,
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                children
              }
            }}
          />
        </div>
      )
    }
  }
]

const InsertCard = () => {
  const insertJsx = usePublisher(insertJsx$)
  return (
    <>
      <Button
        onClick={() =>
          insertJsx({
            name: 'Card',
            kind: 'text',
            props: {}
          })
        }
      >
        Card
      </Button>
    </>
  )
}

const InsertGrid = () => {
  const insertJsx = usePublisher(insertJsx$)
  return (
    <>
      <Button
        onClick={() =>
          insertJsx({
            name: 'Grid',
            kind: 'flow',
            props: {}
          })
        }
      >
        Grid
      </Button>
    </>
  )
}

export const Example = () => {
  return (
    <MDXEditor
      markdown={jsxMarkdown}
      onChange={console.log}
      plugins={[
        jsxPlugin({ jsxComponentDescriptors }),
        diffSourcePlugin({ diffMarkdown: 'An older version', viewMode: 'rich-text' }),
        toolbarPlugin({
          toolbarContents: () => (
            <>
              <DiffSourceToggleWrapper>
                <UndoRedo />
                <InsertCard />
                <InsertGrid />
              </DiffSourceToggleWrapper>
            </>
          )
        })
      ]}
    />
  )
}
