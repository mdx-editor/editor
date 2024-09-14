import React from 'react'
import { MDXEditor, listsPlugin, diffSourcePlugin, toolbarPlugin, DiffSourceToggleWrapper, UndoRedo } from '..'

const listsMarkdown = `
* hello
* world
    * indented
  * more
* back
`

export function NestedLists() {
  return (
    <MDXEditor
      markdown={listsMarkdown}
      onChange={(md) => {
        console.log(md)
      }}
      plugins={[
        listsPlugin(),
        diffSourcePlugin(),
        toolbarPlugin({
          toolbarContents: () => (
            <DiffSourceToggleWrapper>
              <UndoRedo />
            </DiffSourceToggleWrapper>
          )
        })
      ]}
    />
  )
}
