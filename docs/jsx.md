---
title: JSX
slug: jsx
position: 0.815
---

# JSX

The JSX plugin allows you to process and associate custom editors with the JSX components in your markdown source - a capability enabled by [MDX](https://mdxjs.com/). The package includes a generic editor component, but you can also create your custom editors. The next example includes three JSX descriptors and an example of a custom editor that uses the `NestedLexicalEditor` component to edit the markdown contents of a JSX component.

The JSX syntax also supports `{}` as a way to embed JavaScript expressions in your markdown. Out of the box, the plugin will enable a simple inline editor for the expressions, too.

```tsx
const jsxComponentDescriptors: JsxComponentDescriptor[] = [
  {
    name: 'MyLeaf',
    kind: 'text', // 'text' for inline, 'flow' for block
    // the source field is used to construct the import statement at the top of the markdown document.
    // it won't be actually sourced.
    source: './external',
    // Used to construct the property popover of the generic editor
    props: [
      { name: 'foo', type: 'string' },
      { name: 'bar', type: 'string' },
      { name: 'onClick', type: 'expression' }
    ],
    // whether the component has children or not
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

// a toolbar button that will insert a JSX element into the editor.
const InsertMyLeaf = () => {
  const insertJsx = usePublisher(insertJsx$)
  return (
    <Button
      onClick={() =>
        insertJsx({
          name: 'MyLeaf',
          kind: 'text',
          props: { foo: 'bar', bar: 'baz', onClick: { type: 'expression', value: '() => console.log("Clicked")' } }
        })
      }
    >
      Leaf
    </Button>
  )
}

export const Example = () => {
  return (
    <MDXEditor
      markdown={jsxMarkdown} // the contents of the file  below
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
```

```md
import { MyLeaf, BlockNode } from './external';

A paragraph with inline jsx component <MyLeaf foo="bar" bar="baz" onClick={() => console.log("Clicked")}>Nested _markdown_</MyLeaf> more <Marker type="warning" />.

<BlockNode foo="fooValue">
 Content *foo*

more Content
</BlockNode>
```

## Types of properties

There are two types of properties - "textual" and "expressions" in JSX. You can define type in `JsxComponentDescriptor`. `jsxPlugin` will treat the value based on this setting. For example, this code:

```tsx
const jsxComponentDescriptors: JsxComponentDescriptor[] = [
  {
    name: 'MyLeaf',
    kind: 'text',
    props: [
      { name: 'foo', type: 'string' } // Textual property type
    ],
    hasChildren: true,
    Editor: GenericJsxEditor
  }
]
```

will produce component like the following:

```tsx
<MyLeaf foo="bar">Some text...</MyLeaf>
```

While this descriptor:

```tsx
const jsxComponentDescriptors: JsxComponentDescriptor[] = [
  {
    name: 'MyLeaf',
    kind: 'text',
    props: [
      { name: 'foo', type: 'expression' } // Expression property type
    ],
    hasChildren: true,
    Editor: GenericJsxEditor
  }
]
```

will produce:

```tsx
<MyLeaf foo={bar}>Some text...</MyLeaf>
```
