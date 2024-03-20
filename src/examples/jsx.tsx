import React from 'react'
import { MDXEditor } from '../MDXEditor'
import { GenericJsxEditor } from '../jsx-editors/GenericJsxEditor'
import { JsxComponentDescriptor, insertJsx$, jsxPlugin } from '../plugins/jsx'
import jsxMarkdown from './assets/jsx.md?raw'
import { toolbarPlugin } from '../plugins/toolbar'
import { Button } from '../plugins/toolbar/primitives/toolbar'
import { NestedLexicalEditor } from '../plugins/core/NestedLexicalEditor'
import { MdxJsxTextElement } from 'mdast-util-mdx'
import { headingsPlugin } from '..'
import { usePublisher } from '@mdxeditor/gurx'

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
  const insertJsx = usePublisher(insertJsx$)
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

export const JsxExpression = () => {
  return (
    <div>
      <MDXEditor
        onChange={(e) => console.log(e)}
        markdown={`Hello {1+1} after the expression \n\n{2+2}\n`}
        plugins={[headingsPlugin(), jsxPlugin({ jsxComponentDescriptors: [] })]}
      />
    </div>
  )
}

export const JsxFragment = () => {
  return (
    <div>
      <MDXEditor
        onChange={(e) => console.log(e)}
        markdown={`# Fragment
        <></>

        # Nested fragment
        <BlockNode><><BlockNode /><BlockNode /></></BlockNode>`}
        plugins={[headingsPlugin(), jsxPlugin({ jsxComponentDescriptors })]}
      />
    </div>
  )
}

const componentWithExpressionAttribute: JsxComponentDescriptor[] = [
  {
    name: 'BlockNode',
    kind: 'flow',
    source: './external',
    props: [
      {
        name: 'onClick',
        type: 'expression'
      }
    ],
    Editor: GenericJsxEditor,
    hasChildren: true
  }
]

const InsertBlockNodeWithExpressionAttribute = () => {
  const insertJsx = usePublisher(insertJsx$)
  return (
    <Button
      onClick={() =>
        insertJsx({
          name: 'BlockNode',
          kind: 'flow',
          props: { onClick: { type: 'expression', value: '() => console.log' } },
          children: [{ type: 'paragraph', children: [{ type: 'text', value: 'Hello, World!' }] }]
        })
      }
    >
      BlockNode
    </Button>
  )
}

export const ExpressionAttributes = () => {
  return (
    <div>
      <MDXEditor
        onChange={(e) => console.log(e)}
        markdown={`<BlockNode>
        Hello, World!
        </BlockNode>`}
        plugins={[
          headingsPlugin(),
          jsxPlugin({ jsxComponentDescriptors: componentWithExpressionAttribute }),
          toolbarPlugin({ toolbarContents: InsertBlockNodeWithExpressionAttribute })
        ]}
      />
    </div>
  )
}
