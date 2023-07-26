import React from 'react'
import { MDXEditorCore, MDXEditorMethods } from '../MDXEditorCore'
import jsxMarkdown from './assets/jsx.md?raw'
import tableMarkdown from './assets/table-markdown.md?raw'
import imageMarkdown from './assets/image-markdown.md?raw'
import codeBlocksMarkdown from './assets/code-blocks-markdown.md?raw'
import { jsxPlugin } from '../plugins/jsx/realmPlugin'
import { JsxComponentDescriptor } from '../types/JsxComponentDescriptors'
import { GenericJsxEditor } from '../jsx-editors/GenericJsxEditor'
import { headingsPlugin } from '../plugins/headings/realmPlugin'
import { thematicBreakPlugin } from '../plugins/thematic-break/realmPlugin'
import { listsPlugin } from '../plugins/lists/realmPlugin'
import { tablePlugin } from '../plugins/table/realmPlugin'
import { linkPlugin } from '../plugins/link/realmPlugin'
import { imagePlugin } from '../plugins/image/realmPlugin'
import { frontmatterPlugin } from '../plugins/frontmatter/realmPlugin'
import { CodeBlockEditorDescriptor, codeBlockPlugin } from '../plugins/codeblock/realmPlugin'
import { useCodeBlockEditorContext } from '../plugins/codeblock/CodeBlockEditorContainer'
import { virtuosoSampleSandpackConfig } from './boilerplate'
import { sandpackPlugin } from '../plugins/sandpack/realmPlugin'
import { codeMirrorPlugin } from '../plugins/codemirror/realmPlugin'

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

const listsMarkdown = `
* hello
* world
  * indented
  * more
* back

1. more
2. more
`

export function Lists() {
  return <MDXEditorCore markdown={listsMarkdown} plugins={[listsPlugin()]} />
}

export function Table() {
  return <MDXEditorCore markdown={tableMarkdown} plugins={[tablePlugin()]} />
}

export function Link() {
  return <MDXEditorCore markdown={'some [hello](https://google.com) link'} plugins={[linkPlugin()]} />
}

export function Images() {
  // eslint-disable-next-line @typescript-eslint/require-await
  return (
    <MDXEditorCore
      markdown={imageMarkdown}
      plugins={[imagePlugin({ imageUploadHandler: async () => Promise.resolve('https://picsum.photos/200/300') })]}
    />
  )
}

const frontmatterMarkdown = `
---
hello: world
---

this is a cool markdown
`

export function Frontmatter() {
  return <MDXEditorCore markdown={frontmatterMarkdown} plugins={[frontmatterPlugin()]} />
}

const PlainTextCodeEditorDescriptor: CodeBlockEditorDescriptor = {
  match: () => true,
  priority: 0,

  Editor: (props) => {
    const up = useCodeBlockEditorContext()
    return (
      <div onKeyDown={(e) => e.nativeEvent.stopImmediatePropagation()}>
        <textarea rows={3} cols={20} defaultValue={props.code} onChange={(e) => up.setCode(e.target.value)} />
      </div>
    )
  }
}

export function CodeBlock() {
  return (
    <MDXEditorCore
      onChange={(md) => console.log(md)}
      markdown={codeBlocksMarkdown}
      plugins={[
        codeBlockPlugin({ codeBlockEditorDescriptors: [PlainTextCodeEditorDescriptor] }),
        sandpackPlugin({ sandpackConfig: virtuosoSampleSandpackConfig }),
        codeMirrorPlugin({ codeBlockLanguages: { js: 'JavaScript', css: 'CSS' } })
      ]}
    />
  )
}
