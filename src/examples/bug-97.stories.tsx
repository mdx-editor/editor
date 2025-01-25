import React, { useEffect, useRef, useState } from 'react'
import { MDXEditor, MDXEditorMethods } from '..'

export function CatchAll() {
  const [markdown, setMarkdown] = useState(`Line one
Second line



Third line with three empty lines above it`)

  const ref = useRef<MDXEditorMethods>(null)

  useEffect(() => {
    if (ref.current?.getMarkdown() !== markdown) {
      ref.current?.setMarkdown(markdown)
    }
  })

  return (
    <div>
      <button
        onClick={() => {
          setMarkdown(markdown + '_x')
        }}
      >
        Add _x to markdown
      </button>
      <MDXEditor ref={ref} markdown={markdown} plugins={[]} />
    </div>
  )
}
