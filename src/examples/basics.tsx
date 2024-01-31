import React from 'react'
import {
  CodeBlockEditorDescriptor,
  CodeMirrorEditor,
  DiffSourceToggleWrapper,
  GenericJsxEditor,
  InsertFrontmatter,
  JsxComponentDescriptor,
  MDXEditor,
  MDXEditorMethods,
  UndoRedo,
  VoidEmitter,
  codeBlockPlugin,
  codeMirrorPlugin,
  diffSourcePlugin,
  frontmatterPlugin,
  headingsPlugin,
  imagePlugin,
  jsxPlugin,
  linkDialogPlugin,
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
      <div onKeyDown={(e) => e.nativeEvent.stopImmediatePropagation()}>
        <textarea rows={3} cols={20} defaultValue={props.code} onChange={(e) => cb.setCode(e.target.value)} />
      </div>
    )
  }
}

const PlainTextCodeEditorDescriptorUsingCM: CodeBlockEditorDescriptor = {
  match: (language, meta) => {
    return true
  },
  priority: 0,
  Editor: (props) => {
    const voidEmitter: VoidEmitter = {
      subscribe: () => {
        console.log(`voidEmitter subscribe`)
      }
    }

    return CodeMirrorEditor({
      language: props.language || 'text',
      meta: 'RANDOM_STRING',
      nodeKey: 'RANDOM_STRING',
      code: props.code,
      focusEmitter: voidEmitter
    })
  }
}

export function CodeBlockWithAutoTheme() {
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

export function CodeBlockWithDarkTheme() {
  return (
    <MDXEditor
      onChange={console.log}
      markdown={codeBlocksMarkdown}
      plugins={[
        codeBlockPlugin({ codeBlockEditorDescriptors: [PlainTextCodeEditorDescriptor] }),
        sandpackPlugin({ sandpackConfig: virtuosoSampleSandpackConfig }),
        codeMirrorPlugin({ codeBlockLanguages: { js: 'JavaScript', css: 'CSS' }, theme: 'dark' })
      ]}
    />
  )
}

export function CodeBlockWithLightTheme() {
  return (
    <MDXEditor
      onChange={console.log}
      markdown={codeBlocksMarkdown}
      plugins={[
        codeBlockPlugin({ codeBlockEditorDescriptors: [PlainTextCodeEditorDescriptor] }),
        sandpackPlugin({ sandpackConfig: virtuosoSampleSandpackConfig }),
        codeMirrorPlugin({ codeBlockLanguages: { js: 'JavaScript', css: 'CSS' }, theme: 'light' })
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

export function CustomCodeBlockEditorUsingCM() {
  return (
    <MDXEditor
      onChange={console.log}
      markdown={codeBlocksMarkdown}
      plugins={[
        codeBlockPlugin({ codeBlockEditorDescriptors: [PlainTextCodeEditorDescriptorUsingCM] }),
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
      <button onClick={() => setIsOpen(!isOpen)}>Editor is {isOpen ? 'open' : 'closed'}</button>
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
