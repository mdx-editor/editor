import React from 'react'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { $createParagraphNode, $createTextNode, $getRoot, getNearestEditorFromDOMNode } from 'lexical'
import { MDXEditor, type MDXEditorMethods } from '../MDXEditor'
import { toolbarPlugin } from '../plugins/toolbar'
import { tablePlugin } from '../plugins/table'
import { closeImageDialog$, imagePlugin, insertImage$, openNewImageDialog$, saveImage$, type ImageUploadHandler } from '../plugins/image'
import { activeEditor$, rootEditor$ } from '../plugins/core'
import { directivesPlugin } from '../plugins/directives'
import { AdmonitionDirectiveDescriptor } from '../directive-editors/AdmonitionDirectiveDescriptor'
import { InsertImage } from '../plugins/toolbar/components/InsertImage'
import { realmPlugin } from '../RealmWithPlugins'
import type { Realm } from '@mdxeditor/gurx'

const url = 'https://example.com/upload.png'
const file = new File(['image'], 'upload.png', { type: 'image/png' })
const files = Object.assign([file], { item: (i: number) => (i === 0 ? file : null) })
const rect = Object.getOwnPropertyDescriptor(Range.prototype, 'getBoundingClientRect')
const rects = Object.getOwnPropertyDescriptor(Range.prototype, 'getClientRects')
beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => undefined)
  vi.spyOn(window, 'scrollBy').mockImplementation(() => undefined)
  vi.spyOn(HTMLImageElement.prototype, 'src', 'set').mockImplementation(function (this: HTMLImageElement, value: string) {
    this.setAttribute('src', value)
    queueMicrotask(() => this.dispatchEvent(new Event('load')))
  })
  Object.defineProperty(Range.prototype, 'getBoundingClientRect', { configurable: true, value: () => new DOMRect(0, 0, 100, 20) })
  Object.defineProperty(Range.prototype, 'getClientRects', { configurable: true, value: () => [] })
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {
        return undefined
      }
      unobserve() {
        return undefined
      }
      disconnect() {
        return undefined
      }
    }
  )
})
afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  if (rect) Object.defineProperty(Range.prototype, 'getBoundingClientRect', rect)
  else Reflect.deleteProperty(Range.prototype, 'getBoundingClientRect')
  if (rects) Object.defineProperty(Range.prototype, 'getClientRects', rects)
  else Reflect.deleteProperty(Range.prototype, 'getClientRects')
})
function deferred() {
  let resolve!: (value: string) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<string>((yes, no) => {
    resolve = yes
    reject = no
  })
  return { promise, resolve, reject }
}
async function focus(element: HTMLElement) {
  const editor = getNearestEditorFromDOMNode(element)!
  await act(async () => {
    fireEvent.click(element)
    element.focus()
    editor.update(
      () => {
        $getRoot().selectEnd()
      },
      { discrete: true }
    )
    fireEvent(document, new Event('selectionchange'))
    await Promise.resolve()
  })
}
async function setup(
  upload: ImageUploadHandler,
  location: 'root' | 'table' | 'directive' = 'root',
  editing = false,
  options: { openDialog?: boolean; suggestions?: string[]; CustomDialog?: React.FC; withOtherEditor?: boolean } = {}
) {
  const ref = React.createRef<MDXEditorMethods>()
  let realm!: Realm
  const capture = realmPlugin({
    init: (r) => {
      realm = r
    }
  })
  const content = editing ? '![old](https://example.com/old.png "old title")' : 'Hello'
  const markdown =
    location === 'table'
      ? `| A | B |\n| --- | --- |\n| ${content} | Other |`
      : location === 'directive'
        ? `:::note\n${content}\n:::`
        : content + (options.withOtherEditor ? '\n\n| A | B |\n| --- | --- |\n| First | Second |' : '')
  const plugins = [
    capture(),
    tablePlugin(),
    directivesPlugin({ directiveDescriptors: [AdmonitionDirectiveDescriptor] }),
    imagePlugin({ imageUploadHandler: upload, imageAutocompleteSuggestions: options.suggestions ?? [], ImageDialog: options.CustomDialog }),
    toolbarPlugin({ toolbarContents: () => <InsertImage /> })
  ]
  const onChange = vi.fn()
  const view = (readOnly = false) => <MDXEditor ref={ref} markdown={markdown} plugins={plugins} readOnly={readOnly} onChange={onChange} />
  const rendered = render(view())
  const selector = location === 'table' ? 'tbody tr:nth-child(2) [contenteditable="true"]' : '[contenteditable="true"]'
  await waitFor(() => {
    expect(rendered.container.querySelectorAll(selector).length).toBeGreaterThan(0)
  })
  const elements = rendered.container.querySelectorAll<HTMLElement>(selector)
  const target = location === 'directive' ? elements[1] : elements[0]
  await focus(target)
  let dialog!: HTMLElement
  if (options.openDialog !== false) {
    fireEvent.click(await screen.findByRole('button', { name: editing ? 'Edit image' : 'Insert image' }))
    dialog = await screen.findByRole('dialog')
    fireEvent.change(dialog.querySelector('input[type="file"]')!, { target: { files } })
    fireEvent.change(dialog.querySelector('input[name="altText"]')!, { target: { value: 'kept alt' } })
    fireEvent.change(dialog.querySelector('input[name="title"]')!, { target: { value: 'kept title' } })
  }
  const submit = async () => {
    await act(async () => {
      fireEvent.submit(dialog.querySelector('form')!)
      await Promise.resolve()
    })
  }
  return {
    ...rendered,
    ref,
    realm,
    dialog,
    target,
    submit,
    onChange,
    setReadOnly: (readOnly = true) => {
      rendered.rerender(view(readOnly))
    }
  }
}

describe('image dialog upload lifecycle', () => {
  it.each(['root', 'table', 'directive'] as const)('shows pending state and saves once in %s', async (location) => {
    const pending = deferred()
    const upload = vi.fn(() => pending.promise)
    const { submit, dialog, ref, target, realm } = await setup(upload, location)
    await submit()
    await submit()
    act(() => {
      realm.pub(saveImage$, { file: files as unknown as FileList })
    })
    expect(upload).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('status')).toHaveTextContent('Uploading image')
    expect(dialog.querySelector('form')).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeEnabled()
    await act(async () => {
      pending.resolve(url)
      await Promise.resolve()
    })
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull()
    })
    expect(ref.current!.getMarkdown()).toContain(url)
    expect(ref.current!.getMarkdown()).toContain('kept alt')
    expect(ref.current!.getMarkdown().split(url)).toHaveLength(2)
    expect(target.querySelector('img')).toHaveAttribute('src', url)
  })
  it.each(['reject', 'throw'] as const)('retains input and retries after a %s', async (failure) => {
    const upload = vi
      .fn()
      .mockImplementationOnce(() => {
        if (failure === 'throw') throw new Error('secret server detail')
        return Promise.reject(new Error('secret server detail'))
      })
      .mockResolvedValueOnce(url)
    const { submit, dialog, ref } = await setup(upload)
    await submit()
    expect(await screen.findByRole('alert')).toHaveTextContent('Image upload failed')
    expect(screen.queryByText('secret server detail')).toBeNull()
    expect(console.error).toHaveBeenCalledWith(expect.objectContaining({ message: 'secret server detail' }))
    expect(dialog.querySelector('input[name="altText"]')).toHaveValue('kept alt')
    expect(dialog.querySelector('input[name="title"]')).toHaveValue('kept title')
    expect(dialog.querySelector<HTMLInputElement>('input[type="file"]')!.files?.[0]).toBe(file)
    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled()
    await submit()
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull()
    })
    expect(upload).toHaveBeenCalledTimes(2)
    expect(ref.current!.getMarkdown()).toContain(url)
  })
  it.each(['Cancel', 'Escape', 'replace', 'readonly'] as const)('ignores a late upload after %s', async (dismissal) => {
    const pending = deferred()
    const upload = vi.fn(() => pending.promise)
    const { submit, ref, realm, setReadOnly } = await setup(upload, 'table')
    const before = ref.current!.getMarkdown()
    await submit()
    if (dismissal === 'Cancel') fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    if (dismissal === 'Escape') fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
    if (dismissal === 'replace')
      act(() => {
        realm.pub(openNewImageDialog$)
      })
    if (dismissal === 'readonly')
      act(() => {
        setReadOnly()
      })
    await act(async () => {
      pending.resolve(url)
      await Promise.resolve()
    })
    expect(ref.current!.getMarkdown()).toBe(before)
    if (dismissal === 'replace') {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.queryByRole('status')).toBeNull()
      expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled()
    } else expect(screen.queryByRole('dialog')).toBeNull()
  })
  it.each(['root', 'table', 'directive'] as const)(
    'ignores a pending upload when setMarkdown replaces the %s document',
    async (location) => {
      const pending = deferred()
      const { submit, ref } = await setup(() => pending.promise, location)
      await submit()
      await act(async () => {
        ref.current!.setMarkdown('Replacement document')
        await Promise.resolve()
      })
      expect(screen.queryByRole('dialog')).toBeNull()
      await act(async () => {
        pending.resolve(url)
        await Promise.resolve()
      })
      expect(ref.current!.getMarkdown()).toBe('Replacement document')
    }
  )
  it('keeps a pending upload for a no-op setMarkdown', async () => {
    const pending = deferred()
    const { submit, ref } = await setup(() => pending.promise)
    await submit()
    await act(async () => {
      ref.current!.setMarkdown(`  ${ref.current!.getMarkdown()}\n`)
      await Promise.resolve()
    })
    expect(screen.getByRole('status')).toHaveTextContent('Uploading image')
    await act(async () => {
      pending.resolve(url)
      await Promise.resolve()
    })
    expect(ref.current!.getMarkdown()).toContain(url)
  })
  it.each(['resolve', 'reject'] as const)(
    'ignores an old %s after replacing the document and starting a new upload',
    async (settlement) => {
      const first = deferred()
      const second = deferred()
      const upload = vi.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise)
      const { submit, realm, ref, target } = await setup(upload)
      await submit()
      await act(async () => {
        ref.current!.setMarkdown('Replacement document')
        await Promise.resolve()
      })
      await focus(target)
      act(() => {
        realm.pub(openNewImageDialog$)
        realm.pub(saveImage$, { file: files as unknown as FileList, altText: 'new document image' })
      })
      await act(async () => {
        if (settlement === 'resolve') first.resolve('https://example.com/stale.png')
        else first.reject(new Error('old document upload'))
        await Promise.resolve()
      })
      expect(screen.queryByRole('alert')).toBeNull()
      expect(screen.getByRole('status')).toBeInTheDocument()
      expect(ref.current!.getMarkdown()).toBe('Replacement document')
      await act(async () => {
        second.resolve(url)
        await Promise.resolve()
      })
      expect(ref.current!.getMarkdown()).toContain('new document image')
      expect(ref.current!.getMarkdown()).not.toContain('stale.png')
    }
  )
  it('does not let a cancelled rejection overwrite a newer upload status', async () => {
    const first = deferred()
    const second = deferred()
    const upload = vi.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise)
    const { submit, realm, ref } = await setup(upload)
    await submit()
    act(() => {
      realm.pub(openNewImageDialog$)
      realm.pub(saveImage$, { file: files as unknown as FileList, altText: 'second' })
    })
    await act(async () => {
      first.reject(new Error('old request'))
      await Promise.resolve()
    })
    expect(screen.queryByRole('alert')).toBeNull()
    expect(screen.getByRole('status')).toBeInTheDocument()
    await act(async () => {
      second.resolve(url)
      await Promise.resolve()
    })
    expect(ref.current!.getMarkdown()).toContain('second')
  })
  it.each(['root', 'table', 'directive'] as const)('updates an existing image in %s', async (location) => {
    const pending = deferred()
    const { submit, ref } = await setup(() => pending.promise, location, true)
    await submit()
    await act(async () => {
      pending.resolve(url)
      await Promise.resolve()
    })
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull()
    })
    expect(ref.current!.getMarkdown()).toContain(url)
    expect(ref.current!.getMarkdown()).not.toContain('old.png')
    expect(ref.current!.getMarkdown()).toContain('kept title')
  })
  it.each([{ suggestions: [] }, { suggestions: [url] }])(
    'keeps idle URL fields across a parent resync ($suggestions)',
    async ({ suggestions }) => {
      const upload = vi.fn().mockResolvedValue(url)
      const { dialog, ref, submit } = await setup(upload, 'root', false, { suggestions })
      fireEvent.change(dialog.querySelector('input[type="file"]')!, { target: { files: [] } })
      fireEvent.change(dialog.querySelector('input[name="src"]')!, { target: { value: url } })
      await act(async () => {
        ref.current!.setMarkdown('Parent resync\n\n\nNon-normalized Markdown')
        await Promise.resolve()
      })
      expect(screen.getByRole('dialog')).toBe(dialog)
      expect(dialog.querySelector('input[name="src"]')).toHaveValue(url)
      expect(dialog.querySelector('input[name="altText"]')).toHaveValue('kept alt')
      expect(dialog.querySelector('input[name="title"]')).toHaveValue('kept title')
      expect(upload).not.toHaveBeenCalled()
      await submit()
      expect(ref.current!.getMarkdown()).toContain(url)
      expect(ref.current!.getMarkdown()).toContain('kept title')
    }
  )

  describe.each(['root', 'table', 'directive'] as const)('captured %s dialog target', (location) => {
    it.each([
      ['before submit', false],
      ['during upload', false],
      ['before submit', true],
      ['during upload', true]
    ] as const)('keeps the target after switching %s (editing: %s)', async (timing, editing) => {
      const pending = deferred()
      const { submit, ref, target, container, realm } = await setup(() => pending.promise, location, editing, { withOtherEditor: true })
      const other =
        location === 'directive'
          ? container.querySelector<HTMLElement>('[contenteditable="true"]')!
          : container.querySelectorAll<HTMLElement>('tbody tr:nth-child(2) [contenteditable="true"]')[1]
      if (timing === 'during upload') await submit()
      await focus(other)
      const otherEditor = getNearestEditorFromDOMNode(other)!
      expect(realm.getValue(activeEditor$)).toBe(otherEditor)
      if (timing === 'before submit') await submit()
      await act(async () => {
        pending.resolve(url)
        await Promise.resolve()
      })
      expect(ref.current!.getMarkdown()).toContain(url)
      expect(target.querySelector('img')).toHaveAttribute('src', url)
      expect(realm.getValue(activeEditor$)).toBe(otherEditor)
      if (location !== 'directive') {
        expect(other.querySelector('img')).toBeNull()
        expect(other.closest('td')).toHaveAttribute('data-active', 'true')
      }
      if (editing) expect(ref.current!.getMarkdown()).not.toContain('old.png')
    })
  })

  it('saves a URL to the editor captured at dialog open rather than submit', async () => {
    const upload = vi.fn().mockResolvedValue(url)
    const { dialog, submit, target, container } = await setup(upload, 'table')
    fireEvent.change(dialog.querySelector('input[name="file"]')!, { target: { files: [] } })
    fireEvent.change(dialog.querySelector('input[name="src"]')!, { target: { value: url } })
    const other = container.querySelectorAll<HTMLElement>('tbody tr:nth-child(2) [contenteditable="true"]')[1]
    await focus(other)
    await submit()
    expect(target.querySelector('img')).toHaveAttribute('src', url)
    expect(other.querySelector('img')).toBeNull()
    expect(upload).not.toHaveBeenCalled()
  })

  it.each(['reject', 'throw'] as const)('logs a %s for a custom dialog that ignores upload state', async (failure) => {
    const error = new Error('custom dialog upload failed')
    const upload = vi.fn(() => {
      if (failure === 'throw') throw error
      return Promise.reject(error)
    })
    const { realm, ref } = await setup(upload, 'root', false, { openDialog: false, CustomDialog: () => null })
    await act(async () => {
      realm.pub(openNewImageDialog$)
      realm.pub(saveImage$, { file: files as unknown as FileList })
      await Promise.resolve()
    })
    expect(console.error).toHaveBeenCalledWith(error)
    expect(ref.current!.getMarkdown()).not.toContain(url)
  })

  it('ignores resolution after unmount', async () => {
    const pending = deferred()
    const { submit, unmount, onChange } = await setup(() => pending.promise)
    await submit()
    unmount()
    onChange.mockClear()
    await act(async () => {
      pending.resolve(url)
      await Promise.resolve()
    })
    expect(onChange).not.toHaveBeenCalled()
  })
})

describe('imperative image upload lifecycle', () => {
  it.each(['root', 'table', 'directive'] as const)('retains the %s editor selected at invocation', async (location) => {
    const pending = deferred()
    const { realm, target, container, ref } = await setup(() => pending.promise, location, false, {
      openDialog: false,
      withOtherEditor: true
    })
    await act(async () => {
      realm.pub(insertImage$, { file, altText: 'imperative alt', title: 'imperative title', width: 120, height: 80 })
      await Promise.resolve()
    })
    const other =
      location === 'directive'
        ? container.querySelector<HTMLElement>('[contenteditable="true"]')!
        : container.querySelectorAll<HTMLElement>('tbody tr:nth-child(2) [contenteditable="true"]')[1]
    await focus(other)
    const selection = window.getSelection()!.anchorNode
    await act(async () => {
      pending.resolve(url)
      await Promise.resolve()
    })
    expect(target.querySelector('img')).toHaveAttribute('src', url)
    expect(ref.current!.getMarkdown()).toContain('imperative alt')
    expect(ref.current!.getMarkdown()).toContain('imperative title')
    expect(ref.current!.getMarkdown()).toContain('width="120"')
    expect(ref.current!.getMarkdown()).toContain('height="80"')
    expect(realm.getValue(activeEditor$)).toBe(getNearestEditorFromDOMNode(other))
    expect(window.getSelection()!.anchorNode).toBe(selection)
    if (location !== 'directive') expect(other.querySelector('img')).toBeNull()
  })

  describe.each(['root', 'table', 'directive'] as const)('invalidated %s target', (location) => {
    it.each(['replacement', 'readonly', 'unmount'] as const)('ignores a late upload after %s', async (invalidation) => {
      const pending = deferred()
      const { realm, ref, setReadOnly, unmount, onChange } = await setup(() => pending.promise, location, false, { openDialog: false })
      const before = ref.current!.getMarkdown()
      await act(async () => {
        realm.pub(insertImage$, { file })
        await Promise.resolve()
      })
      await act(async () => {
        if (invalidation === 'replacement') ref.current!.setMarkdown('Replacement document')
        if (invalidation === 'readonly') setReadOnly()
        if (invalidation === 'unmount') unmount()
        await Promise.resolve()
      })
      // Becoming editable again must not revive the previous request.
      if (invalidation === 'readonly')
        act(() => {
          setReadOnly(false)
        })
      onChange.mockClear()
      await act(async () => {
        pending.resolve(url)
        await Promise.resolve()
      })
      expect(onChange).not.toHaveBeenCalled()
      if (invalidation !== 'unmount')
        expect(ref.current!.getMarkdown()).toBe(invalidation === 'replacement' ? 'Replacement document' : before)
    })
  })

  it.each(['table', 'directive'] as const)('ignores a removed %s target without a setMarkdown call', async (location) => {
    const pending = deferred()
    const { realm, ref, target } = await setup(() => pending.promise, location, false, { openDialog: false })
    await act(async () => {
      realm.pub(insertImage$, { file })
      await Promise.resolve()
    })
    await act(async () => {
      realm.getValue(rootEditor$)!.update(() => {
        $getRoot()
          .clear()
          .append($createParagraphNode().append($createTextNode('Removed target')))
      })
      await Promise.resolve()
    })
    expect(target.isConnected).toBe(false)
    await act(async () => {
      pending.resolve(url)
      await Promise.resolve()
    })
    expect(ref.current!.getMarkdown()).toBe('Removed target')
  })

  it.each(['reject', 'throw'] as const)('handles and logs a %s without a dialog, then allows retry', async (failure) => {
    const error = new Error('imperative upload failed')
    const upload = vi
      .fn()
      .mockImplementationOnce(() => {
        if (failure === 'throw') throw error
        return Promise.reject(error)
      })
      .mockResolvedValueOnce(url)
    const { realm, ref } = await setup(upload, 'root', false, { openDialog: false, CustomDialog: () => null })
    await act(async () => {
      realm.pub(insertImage$, { file })
      await Promise.resolve()
    })
    expect(console.error).toHaveBeenCalledWith(error)
    expect(screen.queryByRole('dialog')).toBeNull()
    await act(async () => {
      realm.pub(insertImage$, { file, altText: 'retry' })
      await Promise.resolve()
    })
    expect(ref.current!.getMarkdown()).toContain('![retry]')
    expect(ref.current!.getMarkdown()).toContain(url)
  })

  it('allows independent imperative uploads to finish in either order', async () => {
    const first = deferred()
    const second = deferred()
    const upload = vi.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise)
    const { realm, ref } = await setup(upload, 'root', false, { openDialog: false })
    await act(async () => {
      realm.pub(insertImage$, { file, altText: 'first' })
      realm.pub(insertImage$, { file, altText: 'second' })
      await Promise.resolve()
    })
    await act(async () => {
      second.resolve('https://example.com/second.png')
      await Promise.resolve()
    })
    await act(async () => {
      first.resolve('https://example.com/first.png')
      await Promise.resolve()
    })
    expect(ref.current!.getMarkdown()).toContain('![first](https://example.com/first.png)')
    expect(ref.current!.getMarkdown()).toContain('![second](https://example.com/second.png)')
  })

  it('invalidates an imperative upload associated with a cancelled dialog', async () => {
    const pending = deferred()
    const { realm, ref } = await setup(() => pending.promise)
    const before = ref.current!.getMarkdown()
    await act(async () => {
      realm.pub(insertImage$, { file })
      await Promise.resolve()
    })
    act(() => {
      realm.pub(closeImageDialog$)
    })
    await act(async () => {
      pending.resolve(url)
      await Promise.resolve()
    })
    expect(ref.current!.getMarkdown()).toBe(before)
  })

  it('preserves immediate URL insertion and metadata without an upload handler', async () => {
    const { realm, ref } = await setup(null, 'root', false, { openDialog: false })
    await act(async () => {
      realm.pub(insertImage$, { src: url, altText: 'URL alt', title: 'URL title', width: 90, height: 60 })
      await Promise.resolve()
    })
    expect(ref.current!.getMarkdown()).toContain(url)
    expect(ref.current!.getMarkdown()).toContain('alt="URL alt"')
    expect(ref.current!.getMarkdown()).toContain('title="URL title"')
    expect(ref.current!.getMarkdown()).toContain('width="90"')
    expect(ref.current!.getMarkdown()).toContain('height="60"')
  })
})
