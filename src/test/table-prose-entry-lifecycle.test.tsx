import { getPeerDependencyFromEditor } from '@lexical/extension'
import { HistoryExtension } from '@lexical/history'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import {
  $createTextNode,
  $getRoot,
  $isParagraphNode,
  $isElementNode,
  $getSelection,
  $isRangeSelection,
  REDO_COMMAND,
  UNDO_COMMAND,
  type LexicalEditor
} from 'lexical'
import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MDXEditor, type MDXEditorMethods } from '../MDXEditor'
import { rootEditor$ } from '../plugins/core'
import { type RealmPlugin } from '../RealmWithPlugins'
import { imagePlugin } from '../plugins/image'
import { directivesPlugin } from '../plugins/directives'
import { AdmonitionDirectiveDescriptor } from '../directive-editors/AdmonitionDirectiveDescriptor'
import { tablePlugin } from '../plugins/table'
import { quotePlugin } from '../plugins/quote'
import { $isTableNode } from '../plugins/table/TableNode'

const table = '| First |\n| ----- |\n| One |'
const secondTable = '| Second |\n| ------ |\n| Two |'
const adjacentTables = `${table}\n\n${secondTable}`
const rangeRectDescriptor = Object.getOwnPropertyDescriptor(Range.prototype, 'getBoundingClientRect')
const rangeRectsDescriptor = Object.getOwnPropertyDescriptor(Range.prototype, 'getClientRects')

beforeEach(() => {
  vi.spyOn(window, 'scrollBy').mockImplementation(() => undefined)
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

async function setup(markdown = adjacentTables, readOnly = false, extraPlugins: RealmPlugin[] = []) {
  let editor!: LexicalEditor
  const ref = React.createRef<MDXEditorMethods>()
  const plugins = [
    tablePlugin(),
    ...extraPlugins,
    {
      postInit: (realm: import('@mdxeditor/gurx').Realm) => {
        editor = realm.getValue(rootEditor$)!
      }
    }
  ]
  const view = render(<MDXEditor ref={ref} markdown={markdown} readOnly={readOnly} plugins={plugins} />)
  const setReadOnly = (next: boolean) => {
    view.rerender(<MDXEditor ref={ref} markdown={markdown} readOnly={next} plugins={plugins} />)
  }
  await waitFor(() => {
    expect(view.container.querySelector('tbody [data-lexical-editor]')).not.toBeNull()
  })
  const shape = () =>
    editor.getEditorState().read(() =>
      $getRoot()
        .getChildren()
        .map((node) => [node.getType(), node.getTextContent()])
    )
  const history = getPeerDependencyFromEditor<typeof HistoryExtension>(editor, HistoryExtension.name)!.output.historyState.value
  const insert = async (before: boolean, index = 0) => {
    fireEvent.click(screen.getAllByRole('button', { name: 'Table menu' })[index])
    fireEvent.click(await screen.findByRole('button', { name: `Insert paragraph ${before ? 'before' : 'after'} table` }))
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: 'Insert paragraph before table' })).not.toBeInTheDocument()
    })
    // Popover focus teardown happens after unmount.
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10))
    })
  }
  return { ...view, editor, ref, shape, history, insert, setReadOnly }
}

async function finishClose() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 20))
  })
}

function editorShape(editor: LexicalEditor) {
  return editor.getEditorState().read(() =>
    $getRoot()
      .getChildren()
      .map((node) => node.getType())
  )
}

describe('table prose entry independent review', () => {
  it.each([true, false])('does not reuse an image-only paragraph (before=%s)', async (before) => {
    const image = '![](https://example.com/image.png)'
    const { editor, ref, insert } = await setup(`${image}\n\n${table}\n\n${image}`, false, [imagePlugin()])
    const original = editor.getEditorState().read(() =>
      $getRoot()
        .getChildren()
        .map((node) => node.getKey())
    )
    await insert(before)
    const nodes = editor.getEditorState().read(() =>
      $getRoot()
        .getChildren()
        .map((node) => [node.getKey(), node.getType()])
    )
    expect(nodes).toHaveLength(4)
    expect(nodes[0][0]).toBe(original[0])
    expect(nodes[3][0]).toBe(original[2])
    expect(ref.current!.getMarkdown().match(/image.png/g)).toHaveLength(2)
  })

  it('reuses the same empty gap from either of two adjacent table menus', async () => {
    const { shape, history, insert } = await setup()
    await insert(false, 0)
    const baseline = shape()
    const undoDepth = history.undoStack.length
    await insert(true, 1)
    expect(shape()).toEqual(baseline)
    expect(history.undoStack).toHaveLength(undoDepth)
    expect(shape().map(([type]) => type)).toEqual(['table', 'paragraph', 'table', 'paragraph'])
  })

  it('ignores a pending action after the controlled readOnly prop turns true', async () => {
    const { shape, setReadOnly, editor } = await setup()
    fireEvent.click(screen.getAllByRole('button', { name: 'Table menu' })[0])
    fireEvent.click(await screen.findByRole('button', { name: 'Insert paragraph before table' }))
    setReadOnly(true)
    await finishClose()
    expect(editor.isEditable()).toBe(false)
    expect(shape().map(([type]) => type)).toEqual(['table', 'table', 'paragraph'])
  })

  it('rechecks editability if saving the active cell synchronously makes its parent read-only', async () => {
    const { container, editor, ref, shape, insert } = await setup()
    const cell = container.querySelector<HTMLElement>('tbody td [contenteditable="true"]')!
    const cellEditor = (cell as HTMLElement & { __lexicalEditor: LexicalEditor }).__lexicalEditor
    act(() => {
      cell.focus()
    })
    await waitFor(() => {
      expect(cell.closest('td')).toHaveAttribute('data-active', 'true')
    })
    act(() => {
      cellEditor.update(
        () => {
          const paragraph = $getRoot().getFirstChildOrThrow()
          if (!$isParagraphNode(paragraph)) throw new Error('Expected paragraph')
          paragraph.append($createTextNode(' final edit'))
        },
        { discrete: true }
      )
    })
    const unregister = editor.registerUpdateListener(({ dirtyElements }) => {
      if (dirtyElements.size > 0) editor.setEditable(false)
    })
    try {
      await insert(true)
      expect(ref.current!.getMarkdown()).toContain('One final edit')
      expect(editor.isEditable()).toBe(false)
      expect(shape().map(([type]) => type)).toEqual(['table', 'table', 'paragraph'])
    } finally {
      unregister()
    }
  })

  it('ignores a pending action when setMarkdown replaces the target table', async () => {
    const { ref, shape } = await setup()
    fireEvent.click(screen.getAllByRole('button', { name: 'Table menu' })[0])
    fireEvent.click(await screen.findByRole('button', { name: 'Insert paragraph before table' }))
    act(() => {
      ref.current!.setMarkdown(table.replace('One', 'Replacement'))
    })
    await finishClose()
    expect(shape().map(([type]) => type)).toEqual(['table', 'paragraph'])
    expect(ref.current!.getMarkdown()).toContain('Replacement')
  })

  it('uses the current table node after a writable clone was created while its menu was open', async () => {
    const { editor, ref, insert, shape } = await setup()
    fireEvent.click(screen.getAllByRole('button', { name: 'Table menu' })[0])
    act(() => {
      editor.update(
        () => {
          const node = $getRoot().getFirstChildOrThrow()
          if (!$isTableNode(node)) throw new Error('Expected table')
          node.addRowToBottom()
        },
        { discrete: true }
      )
    })
    fireEvent.click(await screen.findByRole('button', { name: 'Insert paragraph before table' }))
    await finishClose()
    expect(shape().map(([type]) => type)).toEqual(['paragraph', 'table', 'table', 'paragraph'])
    expect(
      editor.getEditorState().read(() => {
        const node = $getRoot().getChildAtIndex(1)
        return $isTableNode(node) && node.getRowCount()
      })
    ).toBe(3)
    await insert(true)
    expect(shape()).toHaveLength(4)
    expect(ref.current!.getMarkdown()).toContain('One')
  })

  it('returns focus on Escape without inserting or adding an Undo step', async () => {
    const { shape, history } = await setup()
    const baseline = shape()
    const undoDepth = history.undoStack.length
    const trigger = screen.getAllByRole('button', { name: 'Table menu' })[0]
    act(() => {
      trigger.focus()
    })
    fireEvent.click(trigger)
    const action = await screen.findByRole('button', { name: 'Insert paragraph before table' })
    await waitFor(() => {
      expect(action).toHaveFocus()
    })
    fireEvent.keyDown(action, { key: 'Escape' })
    await finishClose()
    expect(shape()).toEqual(baseline)
    expect(history.undoStack).toHaveLength(undoDepth)
    expect(trigger).toHaveFocus()
  })

  it('does not insert on outside-pointer dismissal', async () => {
    const { shape } = await setup()
    const baseline = shape()
    fireEvent.click(screen.getAllByRole('button', { name: 'Table menu' })[0])
    await screen.findByRole('button', { name: 'Insert paragraph before table' })
    await finishClose()
    fireEvent.pointerDown(document.body)
    await finishClose()
    expect(screen.queryByRole('button', { name: 'Insert paragraph before table' })).not.toBeInTheDocument()
    expect(shape()).toEqual(baseline)
  })

  it('flushes a still-pending cell update before inserting the paragraph', async () => {
    const { container, editor, ref, shape } = await setup()
    const cell = container.querySelector<HTMLElement>('tbody td [contenteditable="true"]')!
    const cellEditor = (cell as HTMLElement & { __lexicalEditor: LexicalEditor }).__lexicalEditor
    act(() => {
      cell.focus()
    })
    await waitFor(() => {
      expect(cell.closest('td')).toHaveAttribute('data-active', 'true')
    })
    const trigger = screen.getAllByRole('button', { name: 'Table menu' })[0]
    act(() => {
      trigger.focus()
    })
    fireEvent.click(trigger)
    const action = await screen.findByRole('button', { name: 'Insert paragraph before table' })
    const dialog = action.closest('[role="dialog"]')!
    let wasPending = false
    dialog.addEventListener(
      'focusScope.autoFocusOnUnmount',
      () => {
        cellEditor.update(() => {
          const paragraph = $getRoot().getFirstChildOrThrow()
          if (!$isParagraphNode(paragraph)) throw new Error('Expected paragraph')
          paragraph.append($createTextNode(' pending'))
        })
        wasPending = !cellEditor.getEditorState().read(() => $getRoot().getTextContent().includes('pending'))
      },
      { once: true }
    )
    fireEvent.click(action)
    await finishClose()
    expect(wasPending).toBe(true)
    expect(ref.current!.getMarkdown()).toContain('One pending')
    expect(shape()).toHaveLength(4)
    act(() => {
      editor.dispatchCommand(UNDO_COMMAND, undefined)
    })
    await waitFor(() => {
      expect(shape()).toHaveLength(3)
    })
    expect(ref.current!.getMarkdown()).toContain('One pending')
  })

  it.each([
    [true, false],
    [true, true],
    [false, false],
    [false, true]
  ])('supports first-action Undo in a nested directive (before=%s, active cell edit=%s)', async (before, editCell) => {
    const { container, editor, ref, insert } = await setup(`:::note\n${adjacentTables}\n:::`, false, [
      directivesPlugin({ directiveDescriptors: [AdmonitionDirectiveDescriptor] })
    ])
    const nestedElement = container.querySelectorAll<HTMLElement>('[contenteditable="true"]')[1]
    const nestedEditor = (nestedElement as HTMLElement & { __lexicalEditor: LexicalEditor }).__lexicalEditor
    const initial = editorShape(nestedEditor)
    if (editCell) {
      const cell = container.querySelector<HTMLElement>('tbody td [contenteditable="true"]')!
      const cellEditor = (cell as HTMLElement & { __lexicalEditor: LexicalEditor }).__lexicalEditor
      act(() => {
        cell.focus()
      })
      await waitFor(() => {
        expect(cell.closest('td')).toHaveAttribute('data-active', 'true')
      })
      act(() => {
        cellEditor.update(
          () => {
            const paragraph = $getRoot().getFirstChildOrThrow()
            if (!$isParagraphNode(paragraph)) throw new Error('Expected paragraph')
            paragraph.append($createTextNode(' edited'))
          },
          { discrete: true }
        )
      })
    }
    const expected = before ? ['paragraph', ...initial] : ['table', 'paragraph', 'table']
    await insert(before)
    expect(editorShape(nestedEditor)).toEqual(expected)
    act(() => {
      nestedEditor.dispatchCommand(UNDO_COMMAND, undefined)
    })
    await waitFor(() => {
      expect(editorShape(nestedEditor)).toEqual(initial)
    })
    if (editCell) expect(ref.current!.getMarkdown()).toContain('One edited')
    expect(editorShape(editor)).toEqual(['directive', 'paragraph'])
    act(() => {
      nestedEditor.dispatchCommand(REDO_COMMAND, undefined)
    })
    await waitFor(() => {
      expect(editorShape(nestedEditor)).toEqual(expected)
    })
    // Empty prose needs no outer save, but ordinary typing and blur must persist it.
    act(() => {
      nestedEditor.update(
        () => {
          const selection = $getSelection()
          if (!$isRangeSelection(selection)) throw new Error('Expected a prose selection')
          selection.insertText('Nested prose')
        },
        { discrete: true }
      )
    })
    fireEvent.blur(nestedElement, { relatedTarget: null })
    await waitFor(() => {
      expect(ref.current!.getMarkdown()).toContain('Nested prose')
    })
    expect(ref.current!.getMarkdown()).toMatch(/^:::note[\s\S]*Nested prose[\s\S]*:::$/)
  })
  it.each([true, false])('inserts within a quote parent and supports first-action Undo (before=%s)', async (before) => {
    const quoted = adjacentTables
      .split('\n')
      .map((line) => `> ${line}`)
      .join('\n')
    const { editor, insert } = await setup(quoted, false, [quotePlugin()])
    const quoteShape = () =>
      editor.getEditorState().read(() => {
        const quote = $getRoot().getFirstChildOrThrow()
        if (!$isElementNode(quote)) throw new Error('Expected a quote element')
        return [quote.getType(), quote.getChildren().map((node) => node.getType())]
      })
    expect(quoteShape()).toEqual(['quote', ['table', 'table']])
    await insert(before)
    expect(quoteShape()).toEqual(['quote', before ? ['paragraph', 'table', 'table'] : ['table', 'paragraph', 'table']])
    act(() => {
      editor.dispatchCommand(UNDO_COMMAND, undefined)
    })
    await waitFor(() => {
      expect(quoteShape()).toEqual(['quote', ['table', 'table']])
    })
  })
})
