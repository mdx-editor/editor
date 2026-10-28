import { act, fireEvent, render, waitFor } from '@testing-library/react'
import {
  HISTORY_PUSH_TAG,
  BLUR_COMMAND,
  $createTextNode,
  $getRoot,
  PASTE_COMMAND,
  REDO_COMMAND,
  UNDO_COMMAND,
  COMMAND_PRIORITY_LOW,
  type LexicalEditor
} from 'lexical'
import React from 'react'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { MDXEditor, type MDXEditorMethods } from '../MDXEditor'
import { tablePlugin, TableNode } from '../plugins/table'
import { toolbarPlugin } from '../plugins/toolbar'
import { UndoRedo } from '../plugins/toolbar/components/UndoRedo'
import { directivesPlugin } from '../plugins/directives'
import { AdmonitionDirectiveDescriptor } from '../directive-editors/AdmonitionDirectiveDescriptor'
import { jsxPlugin } from '../plugins/jsx'
import { GenericJsxEditor } from '../jsx-editors/GenericJsxEditor'
import { getPeerDependencyFromEditor } from '@lexical/extension'
import { HistoryExtension } from '@lexical/history'

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

async function setup(markdown = '| a | b |\n| - | - |\n| c | d |') {
  const ref = React.createRef<MDXEditorMethods>()
  const view = render(
    <MDXEditor
      ref={ref}
      markdown={markdown}
      plugins={[
        tablePlugin(),
        directivesPlugin({ directiveDescriptors: [AdmonitionDirectiveDescriptor] }),
        jsxPlugin({ jsxComponentDescriptors: [{ name: 'Box', kind: 'flow', props: [], hasChildren: true, Editor: GenericJsxEditor }] }),
        toolbarPlugin({ toolbarContents: () => <UndoRedo /> })
      ]}
    />
  )
  const cells = () => Array.from(view.container.querySelectorAll<HTMLElement>('tbody [contenteditable="true"]'))
  await waitFor(() => {
    expect(cells().length).toBeGreaterThanOrEqual(4)
  })
  const editor = (index: number) => (cells()[index] as HTMLElement & { __lexicalEditor: LexicalEditor }).__lexicalEditor
  const parent = editor(0)._parentEditor!
  return { ...view, ref, cells, editor, parent }
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

function history(editor: LexicalEditor) {
  return getPeerDependencyFromEditor<typeof HistoryExtension>(editor, HistoryExtension.name)!.output.historyState.value
}

function command(editor: LexicalEditor, redo = false) {
  act(() => {
    editor.dispatchCommand(redo ? REDO_COMMAND : UNDO_COMMAND, undefined)
  })
}

function type(editor: LexicalEditor, text: string) {
  act(() => {
    editor.update(
      () => {
        $getRoot().selectEnd()
      },
      { discrete: true }
    )
    editor.update(
      () => {
        $getRoot().getLastDescendant()!.insertAfter($createTextNode(text))
      },
      { discrete: true, tag: HISTORY_PUSH_TAG }
    )
  })
}

describe('table region paste', () => {
  it('records expansion and blanks as one parent undo/redo step without routing cell commands', async () => {
    const { cells, editor, ref, parent } = await setup()
    const before = ref.current!.getMarkdown()
    const event = paste(editor(3), 'x\t\ny\tz')
    expect(event.defaultPrevented).toBe(true)
    await waitFor(() => {
      expect(cells()).toHaveLength(9)
    })
    const expected = ['a', 'b', '', 'c', 'x', '', '', 'y', 'z']
    expect(cells().map((cell) => cell.textContent)).toEqual(expected)
    const pasted = ref.current!.getMarkdown()
    expect(history(parent).undoStack).toHaveLength(1)
    command(editor(4))
    expect(ref.current!.getMarkdown()).toBe(pasted)
    command(parent)
    await waitFor(() => {
      expect(cells().map((cell) => cell.textContent)).toEqual(['a', 'b', 'c', 'd'])
    })
    expect(ref.current!.getMarkdown()).toBe(before)
    command(parent, true)
    await waitFor(() => {
      expect(cells().map((cell) => cell.textContent)).toEqual(expected)
    })
    expect(ref.current!.getMarkdown()).toBe(pasted)
  })

  it.each([
    { name: 'HTML', plain: '', html: '<table>' + '<tr><td colspan="1000">A</td></tr>'.repeat(11) + '</table>' },
    { name: 'TSV', plain: Array(1002).fill('x').join('\t') + '\nx\ty', html: '' }
  ])('consumes oversized $name grids without modifying the table', async ({ plain, html }) => {
    const { cells, editor, ref } = await setup()
    const before = ref.current!.getMarkdown()
    expect(paste(editor(2), plain, html).defaultPrevented).toBe(true)
    expect(ref.current!.getMarkdown()).toBe(before)
    expect(cells().map((cell) => cell.textContent)).toEqual(['a', 'b', 'c', 'd'])
  })

  it('clears cells with an empty HTML table and restores them from the parent', async () => {
    const { cells, editor, parent } = await setup()
    paste(editor(0), 'wrong\tfallback', '<table><tr><td></td><td><br></td></tr><tr><td>&nbsp;</td><td> </td></tr></table>')
    await waitFor(() => {
      expect(cells().map((cell) => cell.textContent)).toEqual(['', '', '', ''])
    })
    command(parent)
    await waitFor(() => {
      expect(cells().map((cell) => cell.textContent)).toEqual(['a', 'b', 'c', 'd'])
    })
    command(parent, true)
    await waitFor(() => {
      expect(cells().map((cell) => cell.textContent)).toEqual(['', '', '', ''])
    })
  })

  it('accepts a one-cell HTML table, but not one-row TSV', async () => {
    const { cells, editor, parent } = await setup()
    paste(editor(2), '', '<table><tr><td>one</td></tr></table>')
    await waitFor(() => {
      expect(cells().map((cell) => cell.textContent)).toEqual(['a', 'b', 'one', 'd'])
    })
    command(parent)
    await waitFor(() => {
      expect(cells().map((cell) => cell.textContent)).toEqual(['a', 'b', 'c', 'd'])
    })
  })

  it.each(['root', 'directive', 'jsx', 'multilevel'])('restores pending %s cell text with one parent undo of the paste', async (kind) => {
    const table = '| a | b |\n| - | - |\n| c | d |'
    const markdown =
      kind === 'root'
        ? table
        : kind === 'directive'
          ? `:::note\n${table}\n:::`
          : kind === 'jsx'
            ? `<Box>\n\n${table}\n\n</Box>`
            : `:::note\n<Box>\n\n${table}\n\n</Box>\n:::`
    const { cells, editor, parent } = await setup(markdown)
    type(editor(2), ' typed')
    paste(editor(2), 'x\ty\nz\tw')
    await waitFor(() => {
      expect(cells()[2].textContent).toBe('x')
    })
    command(parent)
    await waitFor(() => {
      expect(cells().map((cell) => cell.textContent)).toEqual(['a', 'b', 'c typed', 'd'])
    })
  })

  it('keeps repeated pastes as separate parent steps and round-trips Markdown', async () => {
    const { cells, editor, parent, ref } = await setup()
    paste(editor(2), 'first\trow\nlower\trow')
    await waitFor(() => {
      expect(cells()[2].textContent).toBe('first')
    })
    paste(editor(2), 'second\trow\nlast\trow')
    await waitFor(() => {
      expect(cells()[2].textContent).toBe('second')
    })
    command(parent)
    await waitFor(() => {
      expect(cells()[2].textContent).toBe('first')
    })
    command(parent)
    await waitFor(() => {
      expect(cells()[2].textContent).toBe('c')
    })
    command(parent, true)
    await waitFor(() => {
      expect(cells()[2].textContent).toBe('first')
    })
    const markdown = ref.current!.getMarkdown()
    act(() => {
      ref.current!.setMarkdown('replacement')
    })
    act(() => {
      ref.current!.setMarkdown(markdown)
    })
    await waitFor(() => {
      expect(cells().map((cell) => cell.textContent)).toEqual(['a', 'b', 'first', 'row', 'lower', 'row'])
    })
  })

  it.each([' plain', '\tindented', 'one\ttwo\tthree', 'first\nsecond', 'if (ready) {\n\trun()\n}'])(
    'leaves non-grid clipboard text to the normal paste handler: %j',
    async (plain) => {
      const { cells, editor, ref } = await setup()
      const before = ref.current!.getMarkdown()
      const fallback = vi.fn(() => true)
      const unregister = editor(2).registerCommand(PASTE_COMMAND, fallback, COMMAND_PRIORITY_LOW)
      const event = paste(editor(2), plain)
      expect(fallback).toHaveBeenCalledOnce()
      expect(event.defaultPrevented).toBe(false)
      expect(ref.current!.getMarkdown()).toBe(before)
      expect(cells().map((cell) => cell.textContent)).toEqual(['a', 'b', 'c', 'd'])
      unregister()
    }
  )

  it('keeps ordinary text paste in the current cell', async () => {
    const { cells, editor } = await setup()
    act(() => {
      editor(2).update(
        () => {
          $getRoot().selectEnd()
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

  it('ignores a late blur from the cell replaced by the paste', async () => {
    const { cells, editor, ref } = await setup()
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
    paste(oldEditor, 'x\ty\nz\tw')
    await waitFor(() => {
      expect(cells()[2].textContent).toBe('x')
    })
    const pasted = ref.current!.getMarkdown()
    act(() => {
      retainedBlur!(new FocusEvent('blur', { relatedTarget: null }))
    })
    expect(ref.current!.getMarkdown()).toBe(pasted)
    expect(cells()[2].textContent).toBe('x')
  })

  it('rejects an oversized destination before saving pending text', async () => {
    const { cells, editor, ref, parent } = await setup()
    type(editor(2), ' pending')
    const before = ref.current!.getMarkdown()
    const canPaste = vi.spyOn(TableNode.prototype, 'canPasteCells').mockReturnValue(false)
    try {
      expect(paste(editor(2), 'x\ty\nz\tw').defaultPrevented).toBe(true)
    } finally {
      canPaste.mockRestore()
    }
    expect(ref.current!.getMarkdown()).toBe(before)
    expect(history(parent).undoStack).toHaveLength(0)
    expect(cells()[2].textContent).toBe('c pending')
  })

  it('preserves local typing undo/redo in an untouched cell across parent paste undo/redo', async () => {
    const { cells, editor, parent, ref } = await setup()
    paste(editor(2), 'x\ty\nz\tw')
    await waitFor(() => {
      expect(cells()[2].textContent).toBe('x')
    })
    const untouched = editor(0)
    type(untouched, ' local')
    command(untouched)
    await waitFor(() => {
      expect(cells()[0].textContent).toBe('a')
    })
    command(parent)
    await waitFor(() => {
      expect(cells()[2].textContent).toBe('c')
    })
    command(untouched, true)
    await waitFor(() => {
      expect(cells()[0].textContent).toBe('a local')
    })
    expect(cells()[2].textContent).toBe('c')
    expect(ref.current!.getMarkdown()).not.toContain('x')
    command(parent, true)
    await waitFor(() => {
      expect(cells()[2].textContent).toBe('x')
    })
    expect(cells()[0].textContent).toBe('a local')
    expect(editor(0)).toBe(untouched)
  })

  it.each(['directive', 'jsx', 'multilevel'])(
    'pastes in an actual %s table and restores the whole region from parent history',
    async (kind) => {
      const table = '| a | b |\n| - | - |\n| c | d |'
      const markdown =
        kind === 'directive'
          ? `:::note\n${table}\n:::`
          : kind === 'jsx'
            ? `<Box>\n\n${table}\n\n</Box>`
            : `:::note\n<Box>\n\n${table}\n\n</Box>\n:::`
      const { cells, editor, parent, ref } = await setup(markdown)
      expect(parent._parentEditor).not.toBeNull()
      const before = ref.current!.getMarkdown()
      paste(editor(2), 'x\ty\nz\tw')
      await waitFor(() => {
        expect(cells()[2].textContent).toBe('x')
        expect(ref.current!.getMarkdown()).toContain('x')
      })
      const pasted = ref.current!.getMarkdown()
      const pasteUndoEntries = history(parent).undoStack.length
      command(parent)
      await waitFor(() => {
        expect(history(parent).redoStack).toHaveLength(1)
      })
      const afterUndo = { cells: cells().map((cell) => cell.textContent), markdown: ref.current!.getMarkdown() }
      command(parent, true)
      await waitFor(() => {
        expect(cells()[2].textContent).toBe('x')
        expect(ref.current!.getMarkdown()).toBe(pasted)
      })
      // An outward export must not add a separate undo step at any depth.
      expect({ pasteUndoEntries, afterUndo }).toEqual({
        pasteUndoEntries: 1,
        afterUndo: { cells: ['a', 'b', 'c', 'd'], markdown: before }
      })
    }
  )
  it.each(['directive', 'jsx', 'multilevel'])('keeps repeated %s pastes and root focus as two logical steps', async (kind) => {
    const table = '| a | b |\n| - | - |\n| c | d |'
    const markdown =
      kind === 'directive'
        ? `:::note\n${table}\n:::`
        : kind === 'jsx'
          ? `<Box>\n\n${table}\n\n</Box>`
          : `:::note\n<Box>\n\n${table}\n\n</Box>\n:::`
    const { cells, editor, parent, ref } = await setup(markdown)
    let root = parent
    while (root._parentEditor) root = root._parentEditor
    const before = ref.current!.getMarkdown()
    for (const value of ['first', 'second']) {
      paste(editor(2), `${value}\trow\nlower\trow`)
      await waitFor(() => {
        expect(cells()[2].textContent).toBe(value)
      })
      act(() => {
        root.update(
          () => {
            $getRoot().selectEnd()
          },
          { discrete: true }
        )
      })
    }
    expect(history(root).undoStack).toHaveLength(2)
    command(root)
    await waitFor(() => {
      expect(cells()[2].textContent).toBe('first')
    })
    command(root)
    await waitFor(() => {
      expect(cells().map((cell) => cell.textContent)).toEqual(['a', 'b', 'c', 'd'])
    })
    expect(ref.current!.getMarkdown()).toBe(before)
    command(root, true)
    await waitFor(() => {
      expect(cells()[2].textContent).toBe('first')
    })
    command(root, true)
    await waitFor(() => {
      expect(cells()[2].textContent).toBe('second')
    })
  })
})
