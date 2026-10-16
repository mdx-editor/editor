import React from 'react'
import { MDXEditor, InsertImage, imagePlugin, toolbarPlugin } from '..'

declare global {
  interface Window {
    settleImageDialogUpload?: (fail: boolean) => void
  }
}

/** An intentionally deferred upload for interrupted-dialog regression tests. */
export function UploadLifecycle() {
  const [markdown, setMarkdown] = React.useState('Upload an image here.')
  const [attempts, setAttempts] = React.useState(0)
  return (
    <>
      <output aria-label="Saved Markdown">{markdown}</output>
      <output aria-label="Upload attempts">{attempts}</output>
      <MDXEditor
        markdown="Upload an image here."
        onChange={setMarkdown}
        plugins={[
          imagePlugin({
            imageUploadHandler: () => {
              setAttempts((count) => count + 1)
              return new Promise<string>((resolve, reject) => {
                window.settleImageDialogUpload = (fail) => {
                  if (fail) reject(new Error('Upload failed'))
                  else resolve('https://example.com/upload-lifecycle.png')
                }
              })
            }
          }),
          toolbarPlugin({ toolbarContents: () => <InsertImage /> })
        ]}
      />
    </>
  )
}
