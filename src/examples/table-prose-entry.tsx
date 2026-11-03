import React from 'react'
import { MDXEditor, MDXEditorMethods, tablePlugin, thematicBreakPlugin, toolbarPlugin, UndoRedo } from '../'

const adjacentTables = '| First |\n| ----- |\n| One |\n\n| Second |\n| ------ |\n| Two |'

export function TableProseEntry() {
  const ref = React.useRef<MDXEditorMethods>(null)
  const [savedMarkdown, setSavedMarkdown] = React.useState('')
  const [readOnly, setReadOnly] = React.useState(false)
  return (
    <>
      <label>
        Document
        <select
          onChange={(event) => {
            ref.current!.setMarkdown(event.target.value)
          }}
          defaultValue={adjacentTables}
        >
          <option value={adjacentTables}>Adjacent tables</option>
          <option value={'Existing prose\n\n| First |\n| ----- |\n| One |\n\n---'}>Table between blocks</option>
        </select>
      </label>
      <label>
        <input
          type="checkbox"
          checked={readOnly}
          onChange={(event) => {
            setReadOnly(event.target.checked)
          }}
        />
        Read only
      </label>
      <button
        onClick={() => {
          setSavedMarkdown(ref.current!.getMarkdown())
        }}
      >
        Save Markdown
      </button>
      <button
        disabled={!savedMarkdown}
        onClick={() => {
          ref.current!.setMarkdown(savedMarkdown)
        }}
      >
        Reload saved Markdown
      </button>
      <MDXEditor
        ref={ref}
        markdown={adjacentTables}
        readOnly={readOnly}
        plugins={[tablePlugin(), thematicBreakPlugin(), toolbarPlugin({ toolbarContents: () => <UndoRedo /> })]}
      />
      <pre data-testid="saved-markdown">{savedMarkdown}</pre>
    </>
  )
}
