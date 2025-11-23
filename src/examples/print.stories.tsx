import React from 'react'
import { MDXEditor, MDXEditorMethods } from '../'
import demoMarkdown from './assets/live-demo-contents.md?raw'
import { ALL_PLUGINS } from './_boilerplate'

function printHTML(html: string) {
  const printWindow = window.open('', '', 'width=800,height=600')
  if (!printWindow) {
    console.error('Failed to open print window')
    return
  }
  printWindow.document.write('<html><head><title>Print</title>')
  printWindow.document.write('</head><body>')
  printWindow.document.write(html)
  printWindow.document.write('</body></html>')
  printWindow.document.close()
  printWindow.print()
  printWindow.close()
}

export function Basics() {
  const mdxEditorRef = React.useRef<MDXEditorMethods>(null)

  return (
    <div>
      <button
        onClick={async () => {
          mdxEditorRef.current?.setMarkdown(demoMarkdown)
          // skip one tick to allow the editor to update
          await Promise.resolve()
          printHTML(mdxEditorRef.current?.getContentEditableHTML() ?? '')
        }}
      >
        Print the contents of the editor
      </button>
      <div style={{ position: 'absolute', visibility: 'hidden' }}>
        <MDXEditor
          ref={mdxEditorRef}
          markdown={''}
          onChange={(md) => {
            console.log('change', { md })
          }}
          plugins={ALL_PLUGINS}
        />
      </div>
    </div>
  )
}
