import { useRealm } from '@mdxeditor/gurx'
import { fireEvent, render, screen } from '@testing-library/react'
import React from 'react'
import { describe, expect, it } from 'vitest'
import { MDXEditor, frontmatterPlugin, imagePlugin, insertFrontmatter$, toolbarPlugin } from '../'
import { InsertImage } from '../plugins/toolbar/components/InsertImage'
import { DialogButton } from '../plugins/toolbar/primitives/DialogButton'

// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

const FrontmatterTrigger = () => {
  const realm = useRealm()
  return (
    <button
      type="button"
      onClick={() => {
        realm.pub(insertFrontmatter$)
      }}
    >
      Edit frontmatter
    </button>
  )
}

/**
 * Asserts that the open dialog with the given accessible name wires an
 * `aria-describedby` to an element carrying the expected description text.
 * Radix warns (and screen readers get no context) when this wiring is missing.
 */
function expectDialogDescription(name: string, description: string) {
  const dialog = screen.getByRole('dialog', { name })
  const describedById = dialog.getAttribute('aria-describedby')
  expect(describedById).toBeTruthy()
  const descriptionElement = document.getElementById(describedById!)
  expect(descriptionElement).toHaveTextContent(description)
}

describe('editor dialog accessibility', () => {
  it('describes the image dialog', () => {
    render(<MDXEditor markdown="" plugins={[imagePlugin(), toolbarPlugin({ toolbarContents: () => <InsertImage /> })]} />)

    fireEvent.click(screen.getByRole('button', { name: 'Insert image' }))

    expectDialogDescription('Upload an image', 'Insert an image from a URL or upload one from your device.')
  })

  it('names and describes the shared toolbar dialog', () => {
    render(
      <MDXEditor
        markdown=""
        plugins={[
          toolbarPlugin({
            toolbarContents: () => (
              <DialogButton
                tooltipTitle="Insert YouTube video"
                dialogInputPlaceholder="Paste URL"
                submitButtonTitle="Insert video"
                onSubmit={() => undefined}
                buttonContent="video"
              />
            )
          })
        ]}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Insert YouTube video' }))

    expectDialogDescription('Insert YouTube video', 'Paste URL')
  })

  it('describes the frontmatter dialog', async () => {
    render(
      <MDXEditor
        markdown={'---\ntitle: hello\n---\n\n# body'}
        plugins={[frontmatterPlugin(), toolbarPlugin({ toolbarContents: () => <FrontmatterTrigger /> })]}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Edit frontmatter' }))

    await screen.findByRole('dialog', { name: 'Edit document frontmatter' })
    expectDialogDescription('Edit document frontmatter', 'Add, edit, or remove the key-value entries of the document frontmatter.')
  })
})
