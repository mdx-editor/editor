import React from 'react'
import { MDXEditor, MDXEditorMethods } from '../'
import markdown from './assets/live-demo-contents.md?raw'
import { ALL_PLUGINS } from './_boilerplate'

export function Basics() {
  const mdxEditorRef = React.useRef<MDXEditorMethods>(null)
  return (
    <div>
      <button
        onClick={() => {
          console.log(mdxEditorRef.current?.getContentEditableHTML())
        }}
      >
        Get HTML
      </button>
      <MDXEditor
        ref={mdxEditorRef}
        markdown={markdown}
        onChange={(md) => {
          console.log('change', { md })
        }}
        plugins={ALL_PLUGINS}
      />
    </div>
  )
}
