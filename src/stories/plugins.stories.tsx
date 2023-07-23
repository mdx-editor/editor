import React from 'react'
import { MDXEditorCore } from '../MDXEditorCore'

export function Example() {
  const [a, setA] = React.useState(10)
  return (
    <>
      <button onClick={() => setA((a) => a + 1)}>Increment</button>
      {a}
      <MDXEditorCore />
    </>
  )
}
