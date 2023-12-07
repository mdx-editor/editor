import React from 'react'
import { MDXEditor } from '../MDXEditor'
import { GenericJsxEditor } from '../jsx-editors/GenericJsxEditor'
import { JsxComponentDescriptor, jsxPlugin, jsxPluginHooks } from '../plugins/jsx'
import jsxMarkdown from './assets/jsx.md?raw'
import { toolbarPlugin } from '../plugins/toolbar'
import { Button } from '../plugins/toolbar/primitives/toolbar'
import { NestedLexicalEditor } from '../plugins/core/NestedLexicalEditor'
import { MdxJsxTextElement } from 'mdast-util-mdx'
import { headingsPlugin } from '..'

const jsxComponentDescriptors: JsxComponentDescriptor[] = [
  {
    name: 'MyLeaf',
    kind: 'text',
    source: './external',
    props: [
      { name: 'foo', type: 'string' },
      { name: 'bar', type: 'string' }
    ],
    hasChildren: true,
    Editor: GenericJsxEditor
  },
  {
    name: 'Marker',
    kind: 'text',
    source: './external',
    props: [{ name: 'type', type: 'string' }],
    hasChildren: false,
    Editor: () => {
      return (
        <div style={{ border: '1px solid red', padding: 8, margin: 8, display: 'inline-block' }}>
          <NestedLexicalEditor<MdxJsxTextElement>
            getContent={(node) => node.children}
            getUpdatedMdastNode={(mdastNode, children: any) => {
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
              return { ...mdastNode, children }
            }}
          />
        </div>
      )
    }
  },
  {
    name: 'BlockNode',
    kind: 'flow',
    source: './external',
    props: [],
    hasChildren: true,
    Editor: GenericJsxEditor
  }
]

const InsertMyLeaf = () => {
  const insertJsx = jsxPluginHooks.usePublisher('insertJsx')
  return (
    <>
      <Button
        onClick={() =>
          insertJsx({
            name: 'MyLeaf',
            kind: 'text',
            props: { foo: 'bar', bar: 'baz' }
          })
        }
      >
        Leaf
      </Button>

      <Button
        onClick={() =>
          insertJsx({
            name: 'MyLeaf',
            kind: 'text',
            props: { foo: 'bar', bar: 'baz' },
            children: [{ type: 'text', value: 'Hello' }]
          })
        }
      >
        Leaf with text
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
        toolbarPlugin({
          toolbarContents: () => (
            <>
              <InsertMyLeaf />
            </>
          )
        })
      ]}
    />
  )
}

const markdown = `
# Hello world

<div style="background: red">
  Content
</div>
`

export const Html = () => {
  return (
    <div>
      <MDXEditor markdown={markdown} plugins={[headingsPlugin(), jsxPlugin({ jsxComponentDescriptors: [] })]} />
    </div>
  )
}
