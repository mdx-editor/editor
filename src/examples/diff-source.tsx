import React from 'react'
import { MDXEditor, MDXEditorMethods, diffSourcePlugin } from '../'
import { useRef } from 'react'

export function GetMarkdownInSourceMode() {
  const ref = useRef<MDXEditorMethods>(null)
  return (
    <div className="App">
      <MDXEditor
        ref={ref}
        onChange={(md) => console.log('change', md)}
        markdown="Hello world"
        plugins={[diffSourcePlugin({ viewMode: 'source' })]}
      />
      <button onClick={() => console.log(ref.current?.getMarkdown())}>Get Markdown</button>
    </div>
  )
}

export function ChangeDiffMakrkdown() {
  const ref = useRef<MDXEditorMethods>(null)
  const [diffMarkdown, setDiffMarkdown] = React.useState('foo')
  return (
    <div className="App">
      <button onClick={() => setDiffMarkdown('bar')}>Change Diff Markdown</button>
      <MDXEditor
        ref={ref}
        onChange={(md) => console.log('change', md)}
        markdown="Hello world"
        plugins={[diffSourcePlugin({ viewMode: 'diff', diffMarkdown })]}
      />
      <button onClick={() => console.log(ref.current?.getMarkdown())}>Get Markdown</button>
    </div>
  )
}
