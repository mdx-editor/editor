import React from 'react'
import {
  MDXEditorCore,
  frontmatterPlugin,
  headingsPlugin,
  imagePlugin,
  linkDialogPlugin,
  linkPlugin,
  listsPlugin,
  quotePlugin,
  tablePlugin,
  thematicBreakPlugin,
  toolbarPlugin
} from '..'

export const Basics = () => {
  return (
    <MDXEditorCore
      markdown="Hello, world!"
      plugins={[
        toolbarPlugin(),
        listsPlugin(),
        quotePlugin(),
        headingsPlugin(),
        linkPlugin(),
        linkDialogPlugin(),
        imagePlugin(),
        tablePlugin(),
        thematicBreakPlugin(),
        frontmatterPlugin()
      ]}
    />
  )
}
