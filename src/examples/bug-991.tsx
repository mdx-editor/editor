import React from 'react'
import { imagePlugin, InsertImage, MDXEditor, tablePlugin, toolbarPlugin } from '..'

const initialMarkdown = '| One | Two |\n| --- | --- |\n| A | B |\n\nOutside the table.'

function TableImageRepro({ markdown }: { markdown: string }) {
  const [version, setVersion] = React.useState(0)
  const [savedMarkdown, setSavedMarkdown] = React.useState(markdown)
  return (
    <>
      <p>Insert an image in a table cell, then move directly to another cell. The saved Markdown should retain the image.</p>
      <button
        onClick={() => {
          setVersion((current) => current + 1)
        }}
      >
        Reload saved Markdown
      </button>
      <output aria-label="Saved Markdown">{savedMarkdown}</output>
      <MDXEditor
        key={version}
        markdown={savedMarkdown}
        onChange={setSavedMarkdown}
        plugins={[tablePlugin(), imagePlugin(), toolbarPlugin({ toolbarContents: () => <InsertImage /> })]}
      />
    </>
  )
}

/** Repro for https://github.com/mdx-editor/editor/issues/991 */
export function TableImageDialog() {
  return <TableImageRepro markdown={initialMarkdown} />
}

/** Edits an image that a table cell already holds. */
export function TableExistingImage() {
  return <TableImageRepro markdown={initialMarkdown.replace('| A |', '| A![old](https://example.com/old-991.png) |')} />
}
