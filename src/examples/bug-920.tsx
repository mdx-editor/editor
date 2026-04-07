import React from 'react'
import { MDXEditor, MDXEditorMethods, quotePlugin } from '..'

const fixture = `> one
> two
>
> three`

export function RoundTripBlockquoteEmptyLine() {
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

      <MDXEditor ref={ref} markdown={markdown} onChange={setMarkdown} plugins={[quotePlugin()]} />

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
