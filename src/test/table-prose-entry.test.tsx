import { getPeerDependencyFromEditor } from '@lexical/extension'
import { HistoryExtension } from '@lexical/history'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $getSelection,
  $isParagraphNode,
  $isRangeSelection,
  REDO_COMMAND,
  UNDO_COMMAND,
  type LexicalEditor
} from 'lexical'
import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MDXEditor, type MDXEditorMethods } from '../MDXEditor'
import { rootEditor$ } from '../plugins/core'
import { tablePlugin } from '../plugins/table'
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

async function setup(markdown = adjacentTables, readOnly = false) {
  let editor!: LexicalEditor
  const ref = React.createRef<MDXEditorMethods>()
  const view = render(
    <MDXEditor
      ref={ref}
      markdown={markdown}
      readOnly={readOnly}
      plugins={[
        tablePlugin(),
        {
          postInit: (realm) => {
            editor = realm.getValue(rootEditor$)!
          }
        }
      ]}
    />
  )
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
  return { ...view, editor, ref, shape, history, insert }
}

describe('explicit table prose entry', () => {
  it.each([true, false])('creates and selects prose only on explicit activation (before=%s)', async (before) => {
    const { editor, ref, shape, insert } = await setup()
    const baseline = ref.current!.getMarkdown()
    expect(shape().map(([type]) => type)).toEqual(['table', 'table', 'paragraph'])
    fireEvent.mouseOver(screen.getAllByRole('table')[0])
    fireEvent.focus(screen.getAllByRole('button', { name: 'Table menu' })[0])
    expect(ref.current!.getMarkdown()).toBe(baseline)
    expect(shape().map(([type]) => type)).toEqual(['table', 'table', 'paragraph'])
    await insert(before)
    expect(shape().map(([type]) => type)).toEqual(
      before ? ['paragraph', 'table', 'table', 'paragraph'] : ['table', 'paragraph', 'table', 'paragraph']
    )
    act(() => {
      editor.update(
        () => {
          const selection = $getSelection()
          expect($isRangeSelection(selection)).toBe(true)
          if ($isRangeSelection(selection)) selection.insertText('New prose')
        },
        { discrete: true }
      )
    })
    const saved = ref.current!.getMarkdown()
    expect(saved.includes(before ? 'New prose\n\n| First' : '| One   |\n\nNew prose\n\n| Second')).toBe(true)
    act(() => {
      ref.current!.setMarkdown(saved)
    })
    expect(ref.current!.getMarkdown()).toBe(saved)
  })

  it.each([true, false])('reuses only the immediately adjacent empty paragraph (before=%s)', async (before) => {
    const { editor, shape, history, insert } = await setup(table)
    if (before) {
      act(() => {
        editor.update(
          () => {
            $getRoot().getFirstChildOrThrow().insertBefore($createParagraphNode())
          },
          { discrete: true }
        )
      })
    }
    const baseline = shape()
    const undoDepth = history.undoStack.length
    await insert(before)
    await insert(before)
    expect(shape()).toEqual(baseline)
    expect(history.undoStack).toHaveLength(undoDepth)
    expect(
      editor.getEditorState().read(() => {
        const selection = $getSelection()
        return $isRangeSelection(selection) && $isParagraphNode(selection.anchor.getNode())
      })
    ).toBe(true)
  })

  it.each([true, false])('keeps a nonempty adjacent paragraph and adds its own (before=%s)', async (before) => {
    const { shape, insert } = await setup(`Existing before\n\n${table}\n\nExisting after`)
    await insert(before)
    expect(shape()).toEqual(
      before
        ? [
            ['paragraph', 'Existing before'],
            ['paragraph', ''],
            ['table', ''],
            ['paragraph', 'Existing after']
          ]
        : [
            ['paragraph', 'Existing before'],
            ['table', ''],
            ['paragraph', ''],
            ['paragraph', 'Existing after']
          ]
    )
  })

  it('supports Undo/Redo when insertion is the first interaction', async () => {
    const { editor, shape, insert } = await setup()
    await insert(true)
    expect(shape()).toHaveLength(4)
    act(() => {
      editor.dispatchCommand(UNDO_COMMAND, undefined)
    })
    await waitFor(() => {
      expect(shape()).toHaveLength(3)
    })
    act(() => {
      editor.dispatchCommand(REDO_COMMAND, undefined)
    })
    await waitFor(() => {
      expect(shape()).toHaveLength(4)
    })
  })

  it('commits an active cell before insertion so one Undo retains the edit', async () => {
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
          if (!$isParagraphNode(paragraph)) throw new Error('Expected a cell paragraph')
          paragraph.append($createTextNode(' edited'))
        },
        { discrete: true }
      )
    })
    expect(ref.current!.getMarkdown()).not.toContain('edited')
    await insert(false)
    expect(ref.current!.getMarkdown()).toContain('One edited')
    expect(shape()).toHaveLength(4)
    act(() => {
      editor.dispatchCommand(UNDO_COMMAND, undefined)
    })
    await waitFor(() => {
      expect(shape()).toHaveLength(3)
    })
    expect(ref.current!.getMarkdown()).toContain('One edited')
    expect(container.querySelector('tbody td [contenteditable="true"]')).toHaveTextContent('One edited')
    act(() => {
      editor.dispatchCommand(REDO_COMMAND, undefined)
    })
    await waitFor(() => {
      expect(shape()).toHaveLength(4)
    })
    expect(ref.current!.getMarkdown()).toContain('One edited')
  })

  it('does not expose table actions in read-only mode', async () => {
    const { shape } = await setup(adjacentTables, true)
    expect(screen.queryByRole('button', { name: 'Table menu' })).not.toBeInTheDocument()
    expect(shape().map(([type]) => type)).toEqual(['table', 'table', 'paragraph'])
  })

  it('checks editability again when a retained open action is activated', async () => {
    const { editor, shape } = await setup()
    fireEvent.click(screen.getAllByRole('button', { name: 'Table menu' })[0])
    const action = await screen.findByRole('button', { name: 'Insert paragraph before table' })
    act(() => {
      editor.setEditable(false)
    })
    fireEvent.click(action)
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10))
    })
    expect(shape().map(([type]) => type)).toEqual(['table', 'table', 'paragraph'])
  })

  it('ignores an action whose table was removed while the menu was closing', async () => {
    const { editor, shape } = await setup()
    fireEvent.click(screen.getAllByRole('button', { name: 'Table menu' })[0])
    fireEvent.click(await screen.findByRole('button', { name: 'Insert paragraph before table' }))
    act(() => {
      editor.update(
        () => {
          const first = $getRoot().getFirstChildOrThrow()
          expect($isTableNode(first)).toBe(true)
          first.remove()
        },
        { discrete: true }
      )
    })
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10))
    })
    expect(shape().map(([type]) => type)).toEqual(['table', 'paragraph'])
  })
})
