import React from 'react'
import { MDXEditor, MDXEditorMethods, InsertImage, imagePlugin, toolbarPlugin } from '..'

declare global {
  interface Window {
    settleImageDialogUpload?: (fail: boolean) => void
    replaceImageDialogDocument?: (markdown: string) => void
  }
}

/** An intentionally deferred upload for interrupted-dialog regression tests. */
export function UploadLifecycle() {
  const [markdown, setMarkdown] = React.useState('Upload an image here.')
  const [attempts, setAttempts] = React.useState(0)
  const editor = React.useRef<MDXEditorMethods>(null)
  React.useEffect(() => {
    window.replaceImageDialogDocument = (nextMarkdown) => {
      editor.current?.setMarkdown(nextMarkdown)
      setMarkdown(nextMarkdown)
    }
    return () => {
      delete window.replaceImageDialogDocument
    }
  }, [])
  return (
    <>
      <output aria-label="Saved Markdown">{markdown}</output>
      <output aria-label="Upload attempts">{attempts}</output>
      <MDXEditor
        ref={editor}
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
