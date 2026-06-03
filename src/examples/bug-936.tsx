import React from 'react'
import { MDXEditor, MDXEditorMethods } from '..'
import { ALL_PLUGINS } from './_boilerplate'

const fixture = `* This is the first list item.
* Here's the second list item.

  I need to add another paragraph below the second list item.
* And here's the third list item.
`

export function RoundTripListItemEmptyLine() {
  const ref = React.useRef<MDXEditorMethods>(null)
  const [markdown, setMarkdown] = React.useState(fixture)
  const [lastReloadedMarkdown, setLastReloadedMarkdown] = React.useState(fixture)

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button
          onClick={() => {
            setMarkdown(fixture)
            setLastReloadedMarkdown(fixture)
            ref.current?.setMarkdown(fixture)
          }}
        >
          Reset fixture
        </button>
        <button
          onClick={() => {
            const nextMarkdown = ref.current?.getMarkdown() ?? ''
            setLastReloadedMarkdown(nextMarkdown)
            ref.current?.setMarkdown(nextMarkdown)
          }}
        >
          Reload exported markdown
        </button>
      </div>

      <MDXEditor
        ref={ref}
        markdown={markdown}
        onChange={(md) => {
          console.log('change', { md })
        }}
        plugins={ALL_PLUGINS}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        <label style={{ display: 'grid', gap: 8 }}>
          <span>Current markdown</span>
          <textarea readOnly value={markdown} rows={6} style={{ fontFamily: 'monospace', width: '100%' }} />
        </label>

        <label style={{ display: 'grid', gap: 8 }}>
          <span>Last reloaded markdown</span>
          <textarea readOnly value={lastReloadedMarkdown} rows={6} style={{ fontFamily: 'monospace', width: '100%' }} />
        </label>
      </div>
    </div>
  )
}
