import React from 'react'
import { MDXEditor, MDXEditorMethods, diffSourcePlugin } from '../'
import { useRef } from 'react'

export function GetMarkdownInSourceMode() {
  const ref = useRef<MDXEditorMethods>(null)
  return (
    <div className="App">
      <MDXEditor
        ref={ref}
        markdown="Hello world"
        plugins={
          [
            // diffSourcePlugin({ viewMode: 'source' })
          ]
        }
      />
      <button onClick={() => console.log(ref.current?.getMarkdown())}>Get Markdown</button>
    </div>
  )
}
