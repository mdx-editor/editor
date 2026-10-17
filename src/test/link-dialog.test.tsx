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

// jsdom implements neither command API, so each test opts into the legacy fallback explicitly.
function setExecCommand(execCommand: unknown, queryCommandSupported: unknown = () => true) {
  Object.defineProperty(document, 'execCommand', { value: execCommand, configurable: true })
  Object.defineProperty(document, 'queryCommandSupported', { value: queryCommandSupported, configurable: true })
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
    Reflect.deleteProperty(document, 'execCommand')
    Reflect.deleteProperty(document, 'queryCommandSupported')
  })

  it('does not render the copy button when neither the Clipboard API nor execCommand can copy', async () => {
    setClipboard(undefined)

    renderEditorWithLinkPreview()

    await screen.findByRole('button', { name: 'Edit link URL' })
    expect(screen.queryByRole('button', { name: 'Copy to clipboard' })).toBeNull()
  })

  it('does not render the copy button when the browser reports the copy command as unsupported', async () => {
    setClipboard(undefined)
    setExecCommand(vi.fn(), () => false)

    renderEditorWithLinkPreview()

    await screen.findByRole('button', { name: 'Edit link URL' })
    expect(screen.queryByRole('button', { name: 'Copy to clipboard' })).toBeNull()
  })

  it('copies the url through the Clipboard API when it is available', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    const execCommand = vi.fn()
    setClipboard({ writeText })
    setExecCommand(execCommand)

    renderEditorWithLinkPreview()

    fireEvent.click(await screen.findByRole('button', { name: 'Copy to clipboard' }))

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith('https://example.com')
    })
    expect((await screen.findAllByText('Copied!')).length).toBeGreaterThan(0)
    expect(execCommand).not.toHaveBeenCalled()
  })

  it('falls back to execCommand from a focused textarea holding the url when the Clipboard API is unavailable', async () => {
    setClipboard(undefined)
    let copiedText: string | null = null
    const execCommand = vi.fn(() => {
      const active = document.activeElement
      copiedText = active instanceof HTMLTextAreaElement ? active.value.slice(active.selectionStart, active.selectionEnd) : null
      return true
    })
    setExecCommand(execCommand)

    renderEditorWithLinkPreview()

    const copyButton = await screen.findByRole('button', { name: 'Copy to clipboard' })
    copyButton.focus()
    fireEvent.click(copyButton)

    expect(execCommand).toHaveBeenCalledWith('copy')
    expect(copiedText).toBe('https://example.com')
    expect(document.querySelector('textarea')).toBeNull()
    expect(document.activeElement).toBe(copyButton)
    expect((await screen.findAllByText('Copied!')).length).toBeGreaterThan(0)
  })

  it('does not report success when the execCommand fallback fails', async () => {
    setClipboard(undefined)
    const execCommand = vi.fn(() => false)
    setExecCommand(execCommand)

    renderEditorWithLinkPreview()

    fireEvent.click(await screen.findByRole('button', { name: 'Copy to clipboard' }))

    await waitFor(() => {
      expect(execCommand).toHaveBeenCalledWith('copy')
    })
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(screen.queryByText('Copied!')).toBeNull()
  })

  it('falls back to execCommand when the Clipboard API rejects', async () => {
    const writeText = vi.fn().mockRejectedValue(new DOMException('Document is not focused.', 'NotAllowedError'))
    const execCommand = vi.fn(() => true)
    setClipboard({ writeText })
    setExecCommand(execCommand)

    renderEditorWithLinkPreview()

    fireEvent.click(await screen.findByRole('button', { name: 'Copy to clipboard' }))

    await waitFor(() => {
      expect(execCommand).toHaveBeenCalledWith('copy')
    })
    expect(writeText).toHaveBeenCalledWith('https://example.com')
    expect((await screen.findAllByText('Copied!')).length).toBeGreaterThan(0)
  })
})
