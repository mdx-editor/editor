import React from 'react'
import {
  DiffSourceToggleWrapper,
  GenericJsxEditor,
  InsertFrontmatter,
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
import { JsxComponentDescriptor } from '@/plugins/jsx/utils'
import { CodeBlockEditorDescriptor } from '@/plugins/codeblock/utils'

const helloMarkdown = `Hello <u>world am **here**</u> more <u>under</u> line. Some \`code with backticks\` and <code>code tag</code> `

export function Bare() {
  const ref = React.useRef<MDXEditorMethods>(null)
  return (
    <>
      <button onClick={() => ref.current?.setMarkdown('new markdown')}>Set new markdown</button>
      <button
        onClick={() => {
          console.log(ref.current?.getMarkdown())
        }}
      >
        Get markdown
      </button>
      <MDXEditor autoFocus={true} ref={ref} markdown={helloMarkdown} onChange={console.log} />
    </>
  )
}

export function Code() {
  const ref = React.useRef<MDXEditorMethods>(null)
  return (
    <>
      <MDXEditor
        autoFocus={true}
        ref={ref}
        markdown={`
backticks
**\`hello\` world**

tag
**<code>hello</code> world**
`}
        onChange={console.log}
      />
    </>
  )
}

export function MoreFormatting() {
  const ref = React.useRef<MDXEditorMethods>(null)
  return (
    <>
      <MDXEditor
        autoFocus={true}
        ref={ref}
        markdown={`
~~scratch this~~ *and <sup>sup this</sup> and <sub>sub this</sub> all in italic*
`}
        onChange={console.log}
      />
    </>
  )
}

export function FocusEmpty() {
  const ref = React.useRef<MDXEditorMethods>(null)
  return (
    <>
      <button onClick={() => ref.current?.focus()}>Focus</button>
      <MDXEditor ref={ref} markdown="" placeholder="Hello..." onChange={console.log} />
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
      { name: 'bar', type: 'expression' }
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
      <button
        onClick={() => {
          console.log(ref.current?.getMarkdown())
        }}
      >
        Get markdown
      </button>

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

... an all empty list

* [ ] Walk the dog
* [ ] Watch movie
* [ ] Have dinner with family
`

export function Lists() {
  return (
    <MDXEditor
      markdown={listsMarkdown}
      plugins={[
        listsPlugin(),
        diffSourcePlugin(),
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

export function Table() {
  return (
    <MDXEditor
      markdown={tableMarkdown}
      plugins={[
        tablePlugin(),
        diffSourcePlugin(),
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
      <div
        onKeyDown={(e) => {
          e.nativeEvent.stopImmediatePropagation()
        }}
      >
        <textarea
          rows={3}
          cols={20}
          defaultValue={props.code}
          onChange={(e) => {
            cb.setCode(e.target.value)
          }}
        />
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
        codeMirrorPlugin({
          codeBlockLanguages: { jsx: 'JavaScript (react)', js: 'JavaScript', css: 'CSS' }
          // codeMirrorExtensions: [basicDark]
        })
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

export function ConditionalRendering() {
  const [isOpen, setIsOpen] = React.useState(false)

  return (
    <div>
      <button
        onClick={() => {
          setIsOpen(!isOpen)
        }}
      >
        Editor is {isOpen ? 'open' : 'closed'}
      </button>
      {isOpen && (
        <MDXEditor
          markdown="# Hello world"
          plugins={[
            toolbarPlugin({
              toolbarContents: () => (
                <>
                  <UndoRedo />
                  {/* If you comment this out, the editor works */}
                </>
              )
            })
          ]}
        />
      )}
    </div>
  )
}
