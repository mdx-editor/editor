import React from 'react'
import { MDXEditor, codeBlockPlugin, codeMirrorPlugin } from '..'

const fixture = `\`\`\`js
const message = 'The language selector and delete button must not cover any part of this long first line of code.'
console.log(message)
\`\`\``

export function CodeBlockToolbar() {
  const [readOnly, setReadOnly] = React.useState(false)
  const [markdown, setMarkdown] = React.useState(fixture)

  return (
    <div style={{ maxWidth: 640 }}>
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
      <MDXEditor
        markdown={fixture}
        readOnly={readOnly}
        onChange={setMarkdown}
        plugins={[
          codeBlockPlugin(),
          codeMirrorPlugin({ codeBlockLanguages: { js: 'JavaScript', txt: 'Plain text' }, autoLoadLanguageSupport: false })
        ]}
      />
      <pre aria-label="Current Markdown">{markdown}</pre>
    </div>
  )
}
