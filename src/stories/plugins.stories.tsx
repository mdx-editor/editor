import React from 'react'
import { MDXEditorCore, MDXEditorMethods } from '../MDXEditorCore'
import jsxMarkdown from './assets/jsx.md?raw'
import { jsxPlugin } from '../plugins/jsx/realmPlugin'
import { JsxComponentDescriptor } from '../types/JsxComponentDescriptors'

export function Core() {
  const ref = React.useRef<MDXEditorMethods>(null)
  return (
    <>
      <button onClick={() => ref.current?.setMarkdown('new markdown')}>Set new markdown</button>
      <button onClick={() => console.log(ref.current?.getMarkdown())}>Get markdown</button>

      <MDXEditorCore ref={ref} markdown={`Hello <u>world am **here**</u> more <u>under</u> line`} onChange={(md) => console.log({ md })} />
    </>
  )
}

const jsxComponentDescriptors: JsxComponentDescriptor[] = [
  {
    name: 'MyLeaf',
    kind: 'text',
    source: './external',
    props: [
      { name: 'foo', type: 'string' },
      { name: 'bar', type: 'string' }
    ],
    hasChildren: true
  },
  {
    name: 'Marker',
    kind: 'text',
    source: './external',
    props: [{ name: 'type', type: 'string' }],
    hasChildren: false
  },
  {
    name: 'BlockNode',
    kind: 'flow',
    source: './external',
    props: [],
    hasChildren: true
  }
]

export function Jsx() {
  const ref = React.useRef<MDXEditorMethods>(null)
  return (
    <>
      <button onClick={() => ref.current?.setMarkdown('new markdown')}>Set new markdown</button>
      <button onClick={() => console.log(ref.current?.getMarkdown())}>Get markdown</button>

      <MDXEditorCore ref={ref} markdown={jsxMarkdown} onChange={console.log} plugins={[jsxPlugin({ jsxComponentDescriptors })]} />
    </>
  )
}
