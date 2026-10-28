import React from 'react'
import { REDO_COMMAND, UNDO_COMMAND, type LexicalEditor } from 'lexical'
import { MDXEditor } from '../MDXEditor'
import { AdmonitionDirectiveDescriptor } from '../directive-editors/AdmonitionDirectiveDescriptor'
import { GenericJsxEditor } from '../jsx-editors/GenericJsxEditor'
import { rootEditor$ } from '../plugins/core'
import { directivesPlugin } from '../plugins/directives'
import { jsxPlugin } from '../plugins/jsx'
import { tablePlugin } from '../plugins/table'

const table = '| a | b |\n| - | - |\n| c | d |'
const documents = {
  root: table,
  directive: `:::note\n${table}\n:::`,
  jsx: `<Box>\n\n${table}\n\n</Box>`,
  multilevel: `:::note\n<Box>\n\n${table}\n\n</Box>\n:::`
}

export function CommittedCells() {
  const [kind, setKind] = React.useState<keyof typeof documents>('root')
  const initial = `Outside the table.\n\n${documents[kind]}`
  const [markdown, setMarkdown] = React.useState(initial)
  const editor = React.useRef<LexicalEditor | null>(null)
  return (
    <>
      <label>
        Container
        <select
          value={kind}
          onChange={(event) => {
            setKind(event.target.value as keyof typeof documents)
          }}
        >
          {Object.keys(documents).map((name) => (
            <option key={name}>{name}</option>
          ))}
        </select>
      </label>
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
        key={kind}
        markdown={initial}
        onChange={setMarkdown}
        plugins={[
          {
            postInit: (realm) => {
              editor.current = realm.getValue(rootEditor$)
            }
          },
          tablePlugin(),
          directivesPlugin({ directiveDescriptors: [AdmonitionDirectiveDescriptor] }),
          jsxPlugin({ jsxComponentDescriptors: [{ name: 'Box', kind: 'flow', props: [], hasChildren: true, Editor: GenericJsxEditor }] })
        ]}
      />
      <pre aria-label="Current Markdown">{markdown}</pre>
    </>
  )
}
