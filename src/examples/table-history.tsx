import React from 'react'
import { REDO_COMMAND, UNDO_COMMAND, type LexicalEditor } from 'lexical'
import { MDXEditor } from '../MDXEditor'
import { rootEditor$ } from '../plugins/core'
import { tablePlugin } from '../plugins/table'

const table = '| a | b |\n| - | - |\n| c | d |'

export function CommittedCells() {
  const initial = `Outside the table.\n\n${table}`
  const [markdown, setMarkdown] = React.useState(initial)
  const editor = React.useRef<LexicalEditor | null>(null)
  return (
    <>
      <button
        onMouseDown={(event) => {
          event.preventDefault()
        }}
        onClick={() => {
          editor.current?.dispatchCommand(UNDO_COMMAND, undefined)
        }}
      >
        Parent Undo
      </button>
      <button
        onMouseDown={(event) => {
          event.preventDefault()
        }}
        onClick={() => {
          editor.current?.dispatchCommand(REDO_COMMAND, undefined)
        }}
      >
        Parent Redo
      </button>
      <MDXEditor
        markdown={initial}
        onChange={setMarkdown}
        plugins={[
          {
            postInit: (realm) => {
              editor.current = realm.getValue(rootEditor$)
            }
          },
          tablePlugin()
        ]}
      />
      <pre aria-label="Current Markdown">{markdown}</pre>
    </>
  )
}
