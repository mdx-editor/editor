import React from 'react'
import { MDXEditorCore, linkPlugin, linkDialogPlugin } from '../'

export function Basics() {
  return (
    <MDXEditorCore
      markdown={`Hello world [link](https://google.com/)`}
      plugins={[linkPlugin(), linkDialogPlugin({ linkAutocompleteSuggestions: ['https://msn.com/', 'https://virtuoso.dev/'] })]}
    />
  )
}
