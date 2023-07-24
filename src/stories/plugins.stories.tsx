import React from 'react'
import { MDXEditorCore, MDXEditorMethods } from '../MDXEditorCore'

export function Example() {
  const ref = React.useRef<MDXEditorMethods>(null)
  const [a, setA] = React.useState(10)
  return (
    <>
      <button onClick={() => ref.current?.setMarkdown('new markdown')}>Set new markdown</button>
      <button onClick={() => console.log(ref.current?.getMarkdown())}>Get markdown</button>

      <MDXEditorCore ref={ref} markdown={`Hello <u>world am **here**</u> more <u>under</u> line`} onChange={(md) => console.log({ md })} />
    </>
  )
}
