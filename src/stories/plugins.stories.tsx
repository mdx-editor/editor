import React from 'react'
import { MDXEditorCore, MDXEditorMethods } from '../MDXEditorCore'
import jsxMarkdown from './assets/jsx.md?raw'
import { jsxPlugin } from '../plugins/jsx/realmPlugin'
import { JsxComponentDescriptor } from '../types/JsxComponentDescriptors'
import { GenericJsxEditor } from '../jsx-editors/GenericJsxEditor'
import { headingsPlugin } from '../plugins/headings/realmPlugin'
import { thematicBreakPlugin, thematicBreakSystem } from '../plugins/thematic-break/realmPlugin'

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
    hasChildren: true,
    Editor: GenericJsxEditor
  },
  {
    name: 'Marker',
    kind: 'text',
    source: './external',
    props: [{ name: 'type', type: 'string' }],
    hasChildren: false,
    Editor: GenericJsxEditor
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

export function Headings() {
  return <MDXEditorCore markdown="# hello world" plugins={[headingsPlugin()]} />
}
const breakMarkdown = `hello 

----------------

world`

export function ThematicBreaks() {
  return <MDXEditorCore markdown={breakMarkdown} plugins={[thematicBreakPlugin()]} />
}
