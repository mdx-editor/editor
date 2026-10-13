import React from 'react'
import { imagePlugin, ImageUploadHandler, InsertImage, MDXEditor, tablePlugin, toolbarPlugin } from '..'

declare global {
  interface Window {
    finishTableImageUpload?: () => void
  }
}

const initialMarkdown = '| One | Two |\n| --- | --- |\n| A | B |\n\nOutside the table.'

function TableImageRepro({ markdown, imageUploadHandler = null }: { markdown: string; imageUploadHandler?: ImageUploadHandler }) {
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
        plugins={[tablePlugin(), imagePlugin({ imageUploadHandler }), toolbarPlugin({ toolbarContents: () => <InsertImage /> })]}
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

/** Holds pasted and dropped uploads until `window.finishTableImageUpload()`, so a test can move to another editor first. */
export function TableLateUpload() {
  return (
    <TableImageRepro
      markdown={initialMarkdown}
      imageUploadHandler={() =>
        new Promise((resolve) => {
          window.finishTableImageUpload = () => {
            resolve('https://example.com/late-991.png')
          }
        })
      }
    />
  )
}
