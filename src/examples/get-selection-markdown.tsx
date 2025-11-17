import React from 'react'
import { MDXEditor, MDXEditorMethods } from '../'
import { ALL_PLUGINS } from './_boilerplate'

const sampleMarkdown = `
# Get Selection Markdown Demo

Try selecting some text below and click the button!

## Features

- **Bold text** and *italic text*
- [Links to websites](https://example.com)
- Inline \`code\` samples

### Lists

* First item
* Second item with **bold**
* Third item

### Table

| Column 1 | Column 2 |
|----------|----------|
| Cell 1   | Cell 2   |
| Cell 3   | Cell 4   |
`.trim()

export function GetSelectionMarkdown() {
  const ref = React.useRef<MDXEditorMethods>(null)
  const [result, setResult] = React.useState<string>('')

  return (
    <div>
      <button
        onClick={() => {
          const markdown = ref.current?.getSelectionMarkdown() ?? ''
          setResult(markdown)
          console.log('Selected markdown:', markdown)
        }}
      >
        Get Selection Markdown
      </button>

      {result && (
        <div style={{ marginTop: '10px', padding: '10px', background: '#f5f5f5' }}>
          <strong>Result:</strong>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{result || '(empty)'}</pre>
        </div>
      )}

      <MDXEditor
        ref={ref}
        markdown={sampleMarkdown}
        plugins={ALL_PLUGINS}
        onChange={(md) => {
          console.log('change', { md })
        }}
      />
    </div>
  )
}
