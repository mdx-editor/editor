import React from 'react'
import { MDXEditorCore } from '../MDXEditorCore'

export function Example() {
  const [a, setA] = React.useState(10)
  return (
    <>
      <MDXEditorCore markdown={`Hello world`} />
    </>
  )
}
