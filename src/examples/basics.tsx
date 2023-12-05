import React from 'react'
import {
  CodeBlockEditorDescriptor,
  DiffSourceToggleWrapper,
  GenericJsxEditor,
  InsertFrontmatter,
  JsxComponentDescriptor,
  MDXEditor,
  MDXEditorMethods,
  UndoRedo,
  codeBlockPlugin,
  codeMirrorPlugin,
  diffSourcePlugin,
  frontmatterPlugin,
  headingsPlugin,
  imagePlugin,
  jsxPlugin,
  linkPlugin,
  listsPlugin,
  markdownShortcutPlugin,
  quotePlugin,
  sandpackPlugin,
  tablePlugin,
  thematicBreakPlugin,
  toolbarPlugin,
  useCodeBlockEditorContext
} from '../'
import codeBlocksMarkdown from './assets/code-blocks.md?raw'
import imageMarkdown from './assets/image.md?raw'
import jsxMarkdown from './assets/jsx.md?raw'
import tableMarkdown from './assets/table.md?raw'

import { virtuosoSampleSandpackConfig } from './_boilerplate'

const helloMarkdown = `Hello <u>world am **here**</u> more <u>under</u> line. Some \`code with backticks\` and <code>code tag</code> `

export function Bare() {
  const ref = React.useRef<MDXEditorMethods>(null)
  return (
    <>
      <button onClick={() => ref.current?.setMarkdown('new markdown')}>Set new markdown</button>
      <button onClick={() => console.log(ref.current?.getMarkdown())}>Get markdown</button>
      <MDXEditor autoFocus={true} ref={ref} markdown={helloMarkdown} onChange={console.log} />
    </>
  )
}

export function Placeholder() {
  return (
    <>
      <MDXEditor placeholder="Type some content here" markdown="" onChange={console.log} />
    </>
  )
}

const breakProducingMarkdown = `Hello  \nWorld`

export function BreakExample() {
  return <MDXEditor markdown={breakProducingMarkdown} onChange={console.log} />
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

      <MDXEditor ref={ref} markdown={jsxMarkdown} onChange={console.log} plugins={[jsxPlugin({ jsxComponentDescriptors })]} />
    </>
  )
}

export function Headings() {
  return <MDXEditor markdown="# hello world" plugins={[headingsPlugin()]} />
}

const breakMarkdown = `hello 

----------------

world`

export function ThematicBreaks() {
  return <MDXEditor markdown={breakMarkdown} plugins={[thematicBreakPlugin()]} />
}

const listsMarkdown = `
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
`

export function Lists() {
  return <MDXEditor markdown={listsMarkdown} plugins={[listsPlugin()]} />
}

export function Table() {
  return <MDXEditor markdown={tableMarkdown} plugins={[tablePlugin()]} />
}

export function Link() {
  return <MDXEditor markdown={'some [hello](https://google.com) link'} plugins={[linkPlugin()]} />
}

export function Images() {
  // eslint-disable-next-line @typescript-eslint/require-await
  return (
    <MDXEditor
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
  return (
    <MDXEditor
      markdown={frontmatterMarkdown}
      plugins={[frontmatterPlugin(), toolbarPlugin({ toolbarContents: () => <InsertFrontmatter /> })]}
    />
  )
}

const PlainTextCodeEditorDescriptor: CodeBlockEditorDescriptor = {
  match: () => true,
  priority: 0,
  Editor: (props) => {
    const cb = useCodeBlockEditorContext()
    return (
      <div onKeyDown={(e) => e.nativeEvent.stopImmediatePropagation()}>
        <textarea rows={3} cols={20} defaultValue={props.code} onChange={(e) => cb.setCode(e.target.value)} />
      </div>
    )
  }
}

export function CodeBlock() {
  return (
    <MDXEditor
      onChange={console.log}
      markdown={codeBlocksMarkdown}
      plugins={[
        codeBlockPlugin({ codeBlockEditorDescriptors: [PlainTextCodeEditorDescriptor] }),
        sandpackPlugin({ sandpackConfig: virtuosoSampleSandpackConfig }),
        codeMirrorPlugin({ codeBlockLanguages: { js: 'JavaScript', css: 'CSS' } })
      ]}
    />
  )
}

export function CustomCodeBlockEditor() {
  return (
    <MDXEditor
      onChange={console.log}
      markdown={codeBlocksMarkdown}
      plugins={[
        codeBlockPlugin({ codeBlockEditorDescriptors: [PlainTextCodeEditorDescriptor] }),
        diffSourcePlugin(),
        toolbarPlugin({ toolbarContents: () => <DiffSourceToggleWrapper>-</DiffSourceToggleWrapper> })
      ]}
    />
  )
}

export function DiffSourcePlugin() {
  return (
    <MDXEditor
      onChange={console.log}
      markdown={'hello world'}
      onBlur={(evt) => console.log('blur event', evt)}
      plugins={[
        diffSourcePlugin({ diffMarkdown: 'An older version', viewMode: 'rich-text' }),
        toolbarPlugin({
          toolbarContents: () => (
            <DiffSourceToggleWrapper>
              <UndoRedo />
            </DiffSourceToggleWrapper>
          )
        })
      ]}
    />
  )
}

export function MarkdownShortcuts() {
  return (
    <MDXEditor
      onChange={console.log}
      markdown={helloMarkdown}
      plugins={[headingsPlugin(), listsPlugin(), linkPlugin(), quotePlugin(), markdownShortcutPlugin()]}
    />
  )
}
