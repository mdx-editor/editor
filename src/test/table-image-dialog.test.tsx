import React from 'react'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, afterEach, describe, expect, it, vi, type Mock } from 'vitest'
import { $getRoot, getNearestEditorFromDOMNode } from 'lexical'
import { MDXEditor, type MDXEditorMethods } from '../MDXEditor'
import { toolbarPlugin } from '../plugins/toolbar'
import { tablePlugin } from '../plugins/table'
import { imagePlugin, type ImageUploadHandler } from '../plugins/image'
import { directivesPlugin } from '../plugins/directives'
import { AdmonitionDirectiveDescriptor } from '../directive-editors/AdmonitionDirectiveDescriptor'
import { InsertImage } from '../plugins/toolbar/components/InsertImage'

const imageUrl = 'https://example.com/image-991.png'
const markdown = '| One | Two |\n| --- | --- |\n| A | B |\n\nOutside the table.'
const rangeRectDescriptor = Object.getOwnPropertyDescriptor(Range.prototype, 'getBoundingClientRect')
const rangeRectsDescriptor = Object.getOwnPropertyDescriptor(Range.prototype, 'getClientRects')

beforeEach(() => {
  vi.spyOn(window, 'scrollBy').mockImplementation(() => undefined)
  // jsdom does not load images; let the real image editor finish rendering.
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
  if (rangeRectDescriptor) Object.defineProperty(Range.prototype, 'getBoundingClientRect', rangeRectDescriptor)
  else Reflect.deleteProperty(Range.prototype, 'getBoundingClientRect')
  if (rangeRectsDescriptor) Object.defineProperty(Range.prototype, 'getClientRects', rangeRectsDescriptor)
  else Reflect.deleteProperty(Range.prototype, 'getClientRects')
})

async function focusCell(cell: HTMLElement) {
  const editor = getNearestEditorFromDOMNode(cell)
  if (!editor) throw new Error('The selected table cell has no Lexical editor')
  await act(async () => {
    fireEvent.click(cell)
    cell.focus()
    editor.update(
      () => {
        $getRoot().selectEnd()
      },
      { discrete: true }
    )
    fireEvent(document, new Event('selectionchange'))
    await Promise.resolve()
  })
  return editor
}

async function setup(initialMarkdown = markdown, imageUploadHandler: ImageUploadHandler = null) {
  const ref = React.createRef<MDXEditorMethods>()
  const onChange = vi.fn<[string, boolean], undefined>()
  const rendered = render(
    <MDXEditor
      ref={ref}
      markdown={initialMarkdown}
      onChange={onChange}
      plugins={[
        tablePlugin(),
        imagePlugin({ imageUploadHandler, allowSetImageDimensions: true }),
        toolbarPlugin({ toolbarContents: () => <InsertImage /> })
      ]}
    />
  )
  await waitFor(() => {
    expect(rendered.container.querySelectorAll('table tbody [contenteditable="true"]')).toHaveLength(4)
  })
  const cells = [...rendered.container.querySelectorAll<HTMLElement>('table tbody [contenteditable="true"]')]
  const sourceCell = cells[2]
  const otherCell = cells[3]
  const sourceEditor = await focusCell(sourceCell)
  onChange.mockClear()
  const root = rendered.container.querySelector<HTMLElement>('[contenteditable="true"][role="textbox"]')!
  return { ref, onChange, sourceCell, otherCell, sourceEditor, root, container: rendered.container, unmount: rendered.unmount }
}

async function openInsertDialog() {
  const insert = screen.getByRole('button', { name: 'Insert image' })
  await act(async () => {
    insert.focus()
    fireEvent.click(insert)
    await Promise.resolve()
  })
  return screen.findByRole('dialog')
}

async function saveDialog() {
  const save = screen.getByRole('button', { name: 'Save' })
  await act(async () => {
    save.focus()
    fireEvent.click(save)
    await Promise.resolve()
  })
}

function setImageUrl(dialog: HTMLElement, src = imageUrl) {
  const input = dialog.querySelector<HTMLInputElement>('input[name="src"]')!
  input.focus()
  fireEvent.change(input, { target: { value: src } })
}

async function insertFromDialog() {
  setImageUrl(await openInsertDialog())
  await saveDialog()
  await waitFor(() => {
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
}

function expectSaved(ref: React.RefObject<MDXEditorMethods | null>, onChange: Mock<[string, boolean], undefined>, src = imageUrl) {
  expect(ref.current?.getMarkdown()).toContain(src)
  expect(onChange.mock.calls.some(([value]) => value.includes(src))).toBe(true)
}

describe('table image dialog persistence', () => {
  it.each(['cell', 'root'] as const)('saves a new image before moving directly to another %s (#991)', async (destination) => {
    const { ref, onChange, otherCell, sourceEditor, root, unmount } = await setup()
    await insertFromDialog()
    await waitFor(() => {
      expect(JSON.stringify(sourceEditor.getEditorState().toJSON())).toContain(imageUrl)
      expectSaved(ref, onChange)
    })
    const target = destination === 'cell' ? otherCell : root
    await focusCell(target)
    expect(target).toHaveFocus()
    expectSaved(ref, onChange)
    const saved = ref.current!.getMarkdown()
    unmount()
    const reloaded = await setup(saved)
    await waitFor(() => {
      expect(reloaded.sourceCell.querySelector('img')).toHaveAttribute('src', imageUrl)
    })
    expect(reloaded.otherCell.querySelector('img')).toBeNull()
    expect(reloaded.ref.current!.getMarkdown()).toBe(saved)
  })

  it.each([false, true])('saves image edits without refocusing its cell (dimensions: %s)', async (withDimensions) => {
    const { ref, onChange, sourceCell, otherCell } = await setup(markdown.replace('| A |', `| A![old](${imageUrl}) |`))
    const edit = await screen.findByRole('button', { name: 'Edit image' })
    await act(async () => {
      edit.focus()
      fireEvent.click(edit)
      await Promise.resolve()
    })
    const dialog = await screen.findByRole('dialog')
    const changedUrl = 'https://example.com/changed-991.png'
    setImageUrl(dialog, changedUrl)
    fireEvent.change(dialog.querySelector('input[name="altText"]')!, { target: { value: 'new alt' } })
    fireEvent.change(dialog.querySelector('input[name="title"]')!, { target: { value: 'new title' } })
    if (withDimensions) {
      fireEvent.change(dialog.querySelector('input[name="width"]')!, { target: { value: '100' } })
      fireEvent.change(dialog.querySelector('input[name="height"]')!, { target: { value: '50' } })
    }
    await saveDialog()
    await waitFor(() => {
      expectSaved(ref, onChange, changedUrl)
    })
    expect(ref.current!.getMarkdown()).toContain(withDimensions ? 'alt="new alt"' : '![new alt]')
    expect(ref.current!.getMarkdown()).toContain('new title')
    if (withDimensions) {
      expect(ref.current!.getMarkdown()).toContain('width="100"')
      expect(ref.current!.getMarkdown()).toContain('height="50"')
    }
    expect(ref.current!.getMarkdown()).not.toContain(imageUrl)
    await focusCell(otherCell)
    expect(otherCell).toHaveFocus()
    expect(sourceCell).not.toHaveFocus()
    expectSaved(ref, onChange, changedUrl)
  })

  it('saves an uploaded image when the asynchronous handler completes', async () => {
    let finishUpload!: (src: string) => void
    const upload = vi.fn(
      () =>
        new Promise<string>((resolve) => {
          finishUpload = resolve
        })
    )
    const { ref, onChange, otherCell } = await setup(markdown, upload)
    const dialog = await openInsertDialog()
    const file = new File(['image'], 'image.png', { type: 'image/png' })
    const files = Object.assign([file], { item: (index: number) => (index === 0 ? file : null) })
    fireEvent.change(dialog.querySelector('input[type="file"]')!, { target: { files } })
    await saveDialog()
    expect(upload).toHaveBeenCalledWith(file)
    expect(ref.current!.getMarkdown()).not.toContain(imageUrl)
    await act(async () => {
      finishUpload(imageUrl)
      await Promise.resolve()
    })
    await waitFor(() => {
      expectSaved(ref, onChange)
    })
    await focusCell(otherCell)
    expect(otherCell).toHaveFocus()
    expectSaved(ref, onChange)
  })

  it.each(['Cancel', 'Escape'])('does not insert an image when dismissing with %s', async (dismissal) => {
    const { ref, onChange, otherCell } = await setup()
    const initial = ref.current!.getMarkdown()
    setImageUrl(await openInsertDialog())
    if (dismissal === 'Cancel') fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    else fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
    await focusCell(otherCell)
    expect(ref.current!.getMarkdown()).toBe(initial)
    expect(onChange.mock.calls.some(([value]) => value.includes(imageUrl))).toBe(false)
  })

  it('preserves root-editor image insertion', async () => {
    const { ref, onChange, root } = await setup()
    await focusCell(root)
    await insertFromDialog()
    await waitFor(() => {
      expectSaved(ref, onChange)
    })
    expect(ref.current!.getMarkdown().split('Outside the table.')[1]).toContain(imageUrl)
  })
  it('synchronizes images inside a nested directive editor', async () => {
    const ref = React.createRef<MDXEditorMethods>()
    const onChange = vi.fn<[string, boolean], undefined>()
    const { container } = render(
      <MDXEditor
        ref={ref}
        markdown={':::note\nInside the note.\n:::'}
        onChange={onChange}
        plugins={[
          directivesPlugin({ directiveDescriptors: [AdmonitionDirectiveDescriptor] }),
          imagePlugin(),
          toolbarPlugin({ toolbarContents: () => <InsertImage /> })
        ]}
      />
    )
    await screen.findByText('Inside the note.')
    const editors = container.querySelectorAll<HTMLElement>('[contenteditable="true"]')
    expect(editors).toHaveLength(2)
    await focusCell(editors[1])
    onChange.mockClear()
    await insertFromDialog()
    await waitFor(() => {
      expectSaved(ref, onChange)
    })
    expect(ref.current!.getMarkdown()).toContain(`Inside the note.![](${imageUrl})`)
    expect(ref.current!.getMarkdown()).toMatch(/^:::note[\s\S]*image-991.png[\s\S]*:::$/)
  })
})
