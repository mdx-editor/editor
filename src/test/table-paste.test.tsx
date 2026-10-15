import { act, fireEvent, render, waitFor } from '@testing-library/react'
import { BLUR_COMMAND, $createTextNode, $getRoot, PASTE_COMMAND, REDO_COMMAND, UNDO_COMMAND, type LexicalEditor } from 'lexical'
import React from 'react'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { MDXEditor, type MDXEditorMethods } from '../MDXEditor'
import { tablePlugin, TableNode } from '../plugins/table'
import { toolbarPlugin } from '../plugins/toolbar'
import { UndoRedo } from '../plugins/toolbar/components/UndoRedo'

const rangeRectDescriptor = Object.getOwnPropertyDescriptor(Range.prototype, 'getBoundingClientRect')
beforeAll(() => {
  Object.defineProperty(Range.prototype, 'getBoundingClientRect', { configurable: true, value: () => new DOMRect(0, 0, 100, 20) })
  vi.spyOn(window, 'scrollBy').mockImplementation(() => undefined)
  vi.stubGlobal('DragEvent', class DragEvent extends Event {})
  vi.stubGlobal('ClipboardEvent', class ClipboardEvent extends Event {})
})
afterAll(() => {
  if (rangeRectDescriptor) Object.defineProperty(Range.prototype, 'getBoundingClientRect', rangeRectDescriptor)
  else Reflect.deleteProperty(Range.prototype, 'getBoundingClientRect')
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

async function setup() {
  const ref = React.createRef<MDXEditorMethods>()
  const view = render(
    <MDXEditor
      ref={ref}
      markdown={'| a | b |\n| - | - |\n| c | d |'}
      plugins={[tablePlugin(), toolbarPlugin({ toolbarContents: () => <UndoRedo /> })]}
    />
  )
  const cells = () => Array.from(view.container.querySelectorAll<HTMLElement>('tbody [contenteditable="true"]'))
  await waitFor(() => {
    expect(cells()).toHaveLength(4)
  })
  const editor = (index: number) => (cells()[index] as HTMLElement & { __lexicalEditor: LexicalEditor }).__lexicalEditor
  return { ...view, ref, cells, editor }
}
function paste(editor: LexicalEditor, plain: string, html = '') {
  const event = new ClipboardEvent('paste', { cancelable: true })
  Object.defineProperty(event, 'clipboardData', {
    value: {
      files: [],
      types: ['text/plain'],
      getData: (type: string) => (type === 'text/html' ? html : type === 'text/plain' ? plain : '')
    }
  })
  act(() => {
    editor.dispatchCommand(PASTE_COMMAND, event as ClipboardEvent)
  })
  return event
}

describe('table region paste', () => {
  it('overwrites from the active cell, grows right and down, preserves blanks, and undoes/redoes once', async () => {
    const { cells, editor, ref } = await setup()
    act(() => {
      cells()[3].focus()
    })
    const event = paste(editor(3), 'x\t\ny\tz')
    expect(event.defaultPrevented).toBe(true)
    await waitFor(() => {
      expect(cells()).toHaveLength(9)
    })
    expect(cells().map((cell) => cell.textContent)).toEqual(['a', 'b', '', 'c', 'x', '', '', 'y', 'z'])
    expect(cells()[4].closest('td')).toHaveAttribute('data-active', 'true')
    expect(ref.current!.getMarkdown()).toContain('x')
    act(() => {
      editor(4).dispatchCommand(UNDO_COMMAND, undefined)
    })
    await waitFor(() => {
      expect(cells().map((cell) => cell.textContent)).toEqual(['a', 'b', 'c', 'd'])
    })
    act(() => {
      editor(3).dispatchCommand(REDO_COMMAND, undefined)
    })
    await waitFor(() => {
      expect(cells()).toHaveLength(9)
    })
    expect(cells().map((cell) => cell.textContent)).toEqual(['a', 'b', '', 'c', 'x', '', '', 'y', 'z'])
  })

  it('restores unsaved cell text on Undo and ignores a stale blur after paste', async () => {
    const { cells, editor } = await setup()
    act(() => {
      cells()[2].focus()
    })
    const oldElement = cells()[2]
    const oldEditor = editor(2)
    act(() => {
      oldEditor.update(
        () => {
          $getRoot().getLastDescendant()!.insertAfter($createTextNode(' typed'))
        },
        { discrete: true }
      )
    })
    paste(oldEditor, 'x\ty')
    await waitFor(() => {
      expect(cells()[2].textContent).toBe('x')
    })
    act(() => {
      fireEvent.blur(oldElement, { relatedTarget: null })
    })
    expect(cells()[2].textContent).toBe('x')
    act(() => {
      editor(2).dispatchCommand(UNDO_COMMAND, undefined)
    })
    await waitFor(() => {
      expect(cells()[2].textContent).toBe('c typed')
    })
  })

  it('keeps repeated pastes as separate Undo steps and roundtrips Markdown', async () => {
    const { cells, editor, ref } = await setup()
    paste(editor(2), 'first\trow')
    await waitFor(() => {
      expect(cells()[2].textContent).toBe('first')
    })
    paste(editor(2), 'second\trow')
    await waitFor(() => {
      expect(cells()[2].textContent).toBe('second')
    })
    act(() => {
      editor(2).dispatchCommand(UNDO_COMMAND, undefined)
    })
    await waitFor(() => {
      expect(cells()[2].textContent).toBe('first')
    })
    act(() => {
      editor(2).dispatchCommand(UNDO_COMMAND, undefined)
    })
    await waitFor(() => {
      expect(cells()[2].textContent).toBe('c')
    })
    act(() => {
      editor(2).dispatchCommand(REDO_COMMAND, undefined)
    })
    await waitFor(() => {
      expect(cells()[2].textContent).toBe('first')
    })
    const markdown = ref.current!.getMarkdown()
    act(() => {
      ref.current!.setMarkdown(markdown)
    })
    await waitFor(() => {
      expect(cells().map((cell) => cell.textContent)).toEqual(['a', 'b', 'first', 'row'])
    })
  })

  it('keeps ordinary text paste in the current cell', async () => {
    const { cells, editor } = await setup()
    act(() => {
      editor(2).update(
        () => {
          $getRoot().getLastChildOrThrow().selectEnd()
        },
        { discrete: true }
      )
    })
    paste(editor(2), ' plain')
    await waitFor(() => {
      expect(cells()[2].textContent).toBe('c plain')
    })
    expect(cells()).toHaveLength(4)
  })

  it('exposes parent paste history to the focused cell toolbar', async () => {
    const { cells, editor, getByRole } = await setup()
    paste(editor(2), 'x\ty')
    await waitFor(() => {
      expect(cells()[2].textContent).toBe('x')
    })
    fireEvent.focus(cells()[2])
    await waitFor(() => {
      expect(getByRole('radio', { name: /Undo/ })).toBeEnabled()
    })
    fireEvent.click(getByRole('radio', { name: /Undo/ }))
    await waitFor(() => {
      expect(cells()[2].textContent).toBe('c')
    })
    fireEvent.focus(cells()[2])
    await waitFor(() => {
      expect(getByRole('radio', { name: /Redo/ })).toBeEnabled()
    })
    fireEvent.click(getByRole('radio', { name: /Redo/ }))
    await waitFor(() => {
      expect(cells()[2].textContent).toBe('x')
    })
  })

  it('ignores an actual retained blur callback from a replaced editor', async () => {
    const { cells, editor } = await setup()
    const oldEditor = editor(2)
    const register = oldEditor.registerCommand.bind(oldEditor)
    let retainedBlur: ((event: FocusEvent) => boolean) | undefined
    const spy = vi.spyOn(oldEditor, 'registerCommand').mockImplementation((command, listener, priority) => {
      if (command === BLUR_COMMAND) retainedBlur = listener as (event: FocusEvent) => boolean
      return register(command, listener, priority)
    })
    fireEvent.focus(cells()[2])
    await waitFor(() => {
      expect(retainedBlur).toBeDefined()
    })
    spy.mockRestore()
    paste(oldEditor, 'new\tregion')
    await waitFor(() => {
      expect(cells()[2].textContent).toBe('new')
    })
    act(() => {
      retainedBlur!(new FocusEvent('blur', { relatedTarget: null }))
    })
    expect(cells()[2].textContent).toBe('new')
    expect(cells()[2].closest('td')).toHaveAttribute('data-active', 'true')
  })

  it('rejects oversized destination before saving pending cell edits', async () => {
    const { cells, editor, ref } = await setup()
    act(() => {
      editor(2).update(
        () => {
          $getRoot().getLastDescendant()!.insertAfter($createTextNode(' pending'))
        },
        { discrete: true }
      )
    })
    const before = ref.current!.getMarkdown()
    const limit = vi.spyOn(TableNode.prototype, 'canPasteCells').mockReturnValue(false)
    try {
      expect(paste(editor(2), 'x\ty').defaultPrevented).toBe(true)
      expect(cells()[2].textContent).toBe('c pending')
      expect(ref.current!.getMarkdown()).toBe(before)
    } finally {
      limit.mockRestore()
    }
  })

  it('keeps local typing undo, then committed edits and paste undo in order', async () => {
    const { cells, editor } = await setup()
    paste(editor(2), 'x\ty')
    await waitFor(() => {
      expect(cells()[2].textContent).toBe('x')
    })
    act(() => {
      editor(2).update(
        () => {
          $getRoot().getLastChildOrThrow().selectEnd()
        },
        { discrete: true }
      )
    })
    act(() => {
      editor(2).update(
        () => {
          $getRoot().getLastDescendant()!.insertAfter($createTextNode(' new'))
        },
        { discrete: true }
      )
    })
    act(() => {
      editor(2).dispatchCommand(UNDO_COMMAND, undefined)
    })
    await waitFor(() => {
      expect(cells()[2].textContent).toBe('x')
    })
    act(() => {
      editor(2).dispatchCommand(REDO_COMMAND, undefined)
    })
    await waitFor(() => {
      expect(cells()[2].textContent).toBe('x new')
    })
    fireEvent.blur(cells()[2], { relatedTarget: null })
    act(() => {
      editor(2).dispatchCommand(UNDO_COMMAND, undefined)
    })
    await waitFor(() => {
      expect(cells()[2].textContent).toBe('x')
    })
    act(() => {
      editor(2).dispatchCommand(UNDO_COMMAND, undefined)
    })
    await waitFor(() => {
      expect(cells()[2].textContent).toBe('c')
    })
    act(() => {
      editor(2).dispatchCommand(REDO_COMMAND, undefined)
    })
    await waitFor(() => {
      expect(cells()[2].textContent).toBe('x')
    })
    act(() => {
      editor(2).dispatchCommand(REDO_COMMAND, undefined)
    })
    await waitFor(() => {
      expect(cells()[2].textContent).toBe('x new')
    })
  })

  it('uses standalone HTML table content rather than the plain fallback', async () => {
    const { cells, editor } = await setup()
    act(() => {
      cells()[0].focus()
    })
    paste(editor(0), 'wrong\tdata', '<table><tr><td>one</td><td></td></tr><tr><td>two</td><td>three</td></tr></table>')
    await waitFor(() => {
      expect(cells().map((cell) => cell.textContent)).toEqual(['one', '', 'two', 'three'])
    })
  })
  it('undo from untouched cell undoes last region paste before older typing', async () => {
    const { cells, editor } = await setup()
    act(() => {
      editor(0).update(
        () => {
          $getRoot().getLastChildOrThrow().selectEnd()
        },
        { discrete: true }
      )
    })
    act(() => {
      editor(0).update(
        () => {
          $getRoot().getLastDescendant()!.insertAfter($createTextNode(' old'))
        },
        { discrete: true }
      )
    })
    fireEvent.blur(cells()[0], { relatedTarget: null })
    await waitFor(() => {
      expect(cells()[0].textContent).toBe('a old')
    })
    paste(editor(2), 'x\ty')
    await waitFor(() => {
      expect(cells()[2].textContent).toBe('x')
    })
    act(() => {
      editor(0).dispatchCommand(UNDO_COMMAND, undefined)
    })
    await waitFor(() => {
      expect(cells().map((c) => c.textContent)).toEqual(['a old', 'b', 'c', 'd'])
    })
    act(() => {
      editor(0).dispatchCommand(UNDO_COMMAND, undefined)
    })
    await waitFor(() => {
      expect(cells().map((c) => c.textContent)).toEqual(['a', 'b', 'c', 'd'])
    })
    act(() => {
      editor(0).dispatchCommand(REDO_COMMAND, undefined)
    })
    await waitFor(() => {
      expect(cells().map((c) => c.textContent)).toEqual(['a old', 'b', 'c', 'd'])
    })
    act(() => {
      editor(0).dispatchCommand(REDO_COMMAND, undefined)
    })
    await waitFor(() => {
      expect(cells().map((c) => c.textContent)).toEqual(['a old', 'b', 'x', 'y'])
    })
  })
})
