import { useRealm } from '@mdxeditor/gurx'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import React from 'react'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { MDXEditor, linkDialogPlugin, linkDialogState$, linkPlugin, toolbarPlugin } from '../'

// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

const OpenLinkPreview = () => {
  const realm = useRealm()
  return (
    <button
      type="button"
      onClick={() => {
        realm.pub(linkDialogState$, {
          type: 'preview',
          title: '',
          url: 'https://example.com',
          href: 'https://example.com',
          linkNodeKey: 'link-key',
          rectangle: { top: 0, left: 0, width: 10, height: 10 }
        })
      }}
    >
      Open preview
    </button>
  )
}

function renderEditorWithLinkPreview() {
  render(
    <MDXEditor markdown="" plugins={[linkPlugin(), linkDialogPlugin(), toolbarPlugin({ toolbarContents: () => <OpenLinkPreview /> })]} />
  )
  fireEvent.click(screen.getByRole('button', { name: 'Open preview' }))
}

function setClipboard(value: unknown) {
  Object.defineProperty(window.navigator, 'clipboard', { value, configurable: true })
}

describe('link dialog copy button', () => {
  beforeAll(() => {
    // Radix popper measures its content with ResizeObserver, which jsdom does not implement.
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe = vi.fn()
        unobserve = vi.fn()
        disconnect = vi.fn()
      }
    )
  })

  afterEach(() => {
    Reflect.deleteProperty(window.navigator, 'clipboard')
  })

  it('does not render the copy button when the Clipboard API is unavailable (insecure context)', async () => {
    setClipboard(undefined)

    renderEditorWithLinkPreview()

    await screen.findByRole('button', { name: 'Edit link URL' })
    expect(screen.queryByRole('button', { name: 'Copy to clipboard' })).toBeNull()
  })

  it('copies the url through the Clipboard API when it is available', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    setClipboard({ writeText })

    renderEditorWithLinkPreview()

    fireEvent.click(await screen.findByRole('button', { name: 'Copy to clipboard' }))

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith('https://example.com')
    })
  })
})
