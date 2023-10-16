import React from 'react'
import {
  MDXEditor,
  linkPlugin,
  linkDialogPlugin,
  AdmonitionDirectiveDescriptor,
  directivesPlugin,
  headingsPlugin,
  quotePlugin,
  listsPlugin,
  toolbarPlugin,
  CreateLink
} from '../'
import admonitionMarkdown from './assets/admonition.md?raw'

export function Basics() {
  return (
    <MDXEditor
      onChange={console.log}
      markdown={`Hello world [link](https://google.com/)`}
      plugins={[linkPlugin(), linkDialogPlugin({ linkAutocompleteSuggestions: ['https://msn.com/', 'https://virtuoso.dev/'] })]}
    />
  )
}

export function WithNestedEditors() {
  return (
    <MDXEditor
      onChange={console.log}
      markdown={admonitionMarkdown}
      plugins={[
        headingsPlugin(),
        quotePlugin(),
        directivesPlugin({ directiveDescriptors: [AdmonitionDirectiveDescriptor] }),
        listsPlugin(),
        linkPlugin(),
        linkDialogPlugin({ linkAutocompleteSuggestions: ['https://msn.com/', 'https://virtuoso.dev/'] })
      ]}
    />
  )
}

export function ParentOffsetOfAnchor() {
  return (
    <div style={{ position: 'relative', marginTop: '100px' }}>
      <MDXEditor
        onChange={console.log}
        markdown={`Hello world [link](https://google.com/)`}
        plugins={[linkPlugin(), linkDialogPlugin({ linkAutocompleteSuggestions: ['https://msn.com/', 'https://virtuoso.dev/'] })]}
      />
    </div>
  )
}

export function EditorInAForm() {
  return (
    <div className="App">
      <form
        onSubmit={(evt) => {
          evt.preventDefault()
          alert('main form submitted')
        }}
        onReset={() => {
          console.log('reset')
        }}
      >
        <MDXEditor
          markdown="[Link](http://www.example.com)"
          plugins={[
            linkPlugin(),
            linkDialogPlugin(),
            toolbarPlugin({
              toolbarContents: () => (
                <>
                  <CreateLink />
                </>
              )
            })
          ]}
        />
        <button type="submit">Submit</button>
      </form>
    </div>
  )
}
