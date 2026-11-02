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
        jsxPlugin({
          jsxComponentDescriptors: [
            { name: 'Box', kind: 'flow', props: [], hasChildren: true, Editor: GenericJsxEditor },
            { name: 'Inline', kind: 'text', props: [], hasChildren: true, Editor: GenericJsxEditor }
          ]
        }),
        toolbarPlugin({ toolbarContents: () => <UndoRedo /> })
      ]}
    />
  )
  const cells = () => Array.from(view.container.querySelectorAll<HTMLElement>('tbody > tr > :is(th, td) > [contenteditable="true"]'))
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
  it('records expansion and blanks as one parent step and focuses the parent for immediate Undo', async () => {
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
    await waitFor(() => {
      expect(document.activeElement).toBe(parent.getRootElement())
    })
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
    { name: 'TSV', plain: Array(1002).fill('x').join('\t') + '\nx\ty', html: '' },
    { name: 'HTML over 1 MB', plain: 'preserved', html: '<table>' + 'x'.repeat(1000001) + '</table>' }
  ])('does not claim oversized $name data without a range selection', async ({ plain, html }) => {
    const { cells, editor, ref } = await setup()
    const before = ref.current!.getMarkdown()
    const fallback = vi.fn(() => true)
    const unregister = editor(2).registerCommand(PASTE_COMMAND, fallback, COMMAND_PRIORITY_LOW)
    expect(paste(editor(2), plain, html).defaultPrevented).toBe(false)
    expect(fallback).toHaveBeenCalledOnce()
    unregister()
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

  it.each([
    '<table><tr><td>one</td></tr></table>',
    '<table><tr><td>one</td><td>two</td></tr></table>',
    '<table><tr><td>one</td></tr><tr><td>two</td></tr></table>'
  ])('leaves a one-dimensional HTML table to ordinary paste: %s', async (html) => {
    const { cells, editor } = await setup()
    const fallback = vi.fn(() => true)
    const unregister = editor(2).registerCommand(PASTE_COMMAND, fallback, COMMAND_PRIORITY_LOW)
    expect(paste(editor(2), 'one', html).defaultPrevented).toBe(false)
    expect(fallback).toHaveBeenCalledOnce()
    expect(cells().map((cell) => cell.textContent)).toEqual(['a', 'b', 'c', 'd'])
    unregister()
  })

  it('preserves a single HTML cell at the caret after blur and Markdown reload', async () => {
    const { cells, editor, ref, container } = await setup()
    act(() => {
      editor(2).update(
        () => {
          $getRoot().selectEnd()
        },
        { discrete: true }
      )
    })
    paste(editor(2), 'one', '<table><tr><td>one</td></tr></table>')
    await waitFor(() => {
      expect(cells()[2]).toHaveTextContent('cone')
    })
    expect(container.querySelectorAll('table')).toHaveLength(1)
    act(() => {
      editor(2).dispatchCommand(BLUR_COMMAND, new FocusEvent('blur', { relatedTarget: null }))
    })
    await waitFor(() => {
      expect(ref.current!.getMarkdown()).toContain('cone')
    })
    const markdown = ref.current!.getMarkdown()
    act(() => {
      ref.current!.setMarkdown('replacement')
    })
    await waitFor(() => {
      expect(cells()).toHaveLength(0)
    })
    act(() => {
      ref.current!.setMarkdown(markdown)
    })
    await waitFor(() => {
      expect(cells().map((cell) => cell.textContent)).toEqual(['a', 'b', 'cone', 'd'])
    })
  })

  it.each(['', ' ', '<br>'])('does not import a nested table for an empty HTML-only cell: %j', async (content) => {
    const { cells, editor, container } = await setup()
    act(() => {
      editor(2).update(
        () => {
          $getRoot().selectEnd()
        },
        { discrete: true }
      )
    })
    expect(paste(editor(2), '', `<table><tr><td>${content}</td></tr></table>`).defaultPrevented).toBe(true)
    await waitFor(() => {
      expect(container.querySelectorAll('table')).toHaveLength(1)
    })
    expect(cells()).toHaveLength(4)
    expect(cells()[2].textContent).toMatch(/^c/)
  })

  it.each([
    { name: 'indented code', text: '\tfoo()\n\tbar()', html: '', end: 'bar()' },
    { name: 'oversized TSV', text: Array(1002).fill('x').join('\t') + '\nx\tlast', html: '', end: 'last' },
    { name: 'oversized HTML', text: '\tfirst\n\tvalue', html: '<table>' + ' '.repeat(1000001) + '</table>', end: 'value' },
    { name: 'HTML-only cell', text: '', html: '<table><tr><td>only</td></tr></table>', end: 'only' }
  ])('preserves $name as caret text through blur and Markdown reload', async ({ text, html, end }) => {
    const { cells, editor, ref, container } = await setup()
    act(() => {
      editor(2).update(
        () => {
          $getRoot().selectEnd()
        },
        { discrete: true }
      )
    })
    paste(editor(2), text, html)
    await waitFor(() => {
      expect(cells()[2].textContent).toContain(end)
    })
    expect(container.querySelectorAll('table')).toHaveLength(1)
    act(() => {
      editor(2).dispatchCommand(BLUR_COMMAND, new FocusEvent('blur', { relatedTarget: null }))
    })
    await waitFor(() => {
      expect(ref.current!.getMarkdown()).toContain(end)
    })
    const markdown = ref.current!.getMarkdown()
    act(() => {
      ref.current!.setMarkdown('replacement')
    })
    await waitFor(() => {
      expect(cells()).toHaveLength(0)
    })
    act(() => {
      ref.current!.setMarkdown(markdown)
    })
    await waitFor(() => {
      expect(cells()[2].textContent).toContain(end)
    })
    await waitFor(() => {
      expect(cells()).toHaveLength(4)
      expect(cells()[2].textContent).toMatch(/^c/)
      expect(cells()[2].textContent).toContain(end)
      expect([cells()[0].textContent, cells()[1].textContent, cells()[3].textContent]).toEqual(['a', 'b', 'd'])
    })
  })

  it('restores pending anchor text without a second parent history entry', async () => {
    const { cells, editor, parent, ref } = await setup()
    type(editor(2), ' typed')
    paste(editor(2), 'x\ty\nz\tw')
    await waitFor(() => {
      expect(cells()[2].textContent).toBe('x')
    })
    expect(history(parent).undoStack).toHaveLength(1)
    command(parent)
    await waitFor(() => {
      expect(cells().map((cell) => cell.textContent)).toEqual(['a', 'b', 'c typed', 'd'])
    })
    expect(history(parent).undoStack).toHaveLength(0)
    expect(history(parent).redoStack).toHaveLength(1)
    const restored = ref.current!.getMarkdown()
    command(parent)
    expect(ref.current!.getMarkdown()).toBe(restored)
    command(parent, true)
    await waitFor(() => {
      expect(cells()[2].textContent).toBe('x')
    })
  })

  it('enables toolbar Undo immediately after a paste and redoes the same region', async () => {
    const { cells, editor, getByRole } = await setup()
    paste(editor(2), 'x\ty\nz\tw')
    const undo = getByRole('radio', { name: /^Undo / })
    const redo = getByRole('radio', { name: /^Redo / })
    await waitFor(() => {
      expect(undo).toBeEnabled()
    })
    fireEvent.click(undo)
    await waitFor(() => {
      expect(cells().map((cell) => cell.textContent)).toEqual(['a', 'b', 'c', 'd'])
    })
    await waitFor(() => {
      expect(redo).toBeEnabled()
    })
    fireEvent.click(redo)
    await waitFor(() => {
      expect(cells().map((cell) => cell.textContent)).toEqual(['a', 'b', 'x', 'y', 'z', 'w'])
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
    await waitFor(() => {
      expect(cells()).toHaveLength(0)
    })
    act(() => {
      ref.current!.setMarkdown(markdown)
    })
    await waitFor(() => {
      expect(cells().map((cell) => cell.textContent)).toEqual(['a', 'b', 'first', 'row', 'lower', 'row'])
    })
  })

  it.each([
    ' plain',
    '\tindented',
    'one\ttwo\tthree',
    'first\nsecond',
    'if (ready) {\n\trun()\n}',
    '\tfoo()\n\tbar()',
    '\tA\tint\n\tB\tstring',
    '\techo build\n\ttouch output'
  ])('leaves non-grid clipboard text to the normal paste handler: %j', async (plain) => {
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
  })

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
    act(() => {
      editor(2).update(
        () => {
          $getRoot().selectEnd()
        },
        { discrete: true }
      )
    })
    const before = ref.current!.getMarkdown()
    const canPaste = vi.spyOn(TableNode.prototype, 'canPasteCells').mockReturnValue(false)
    const fallback = vi.fn(() => true)
    const unregister = editor(2).registerCommand(PASTE_COMMAND, fallback, COMMAND_PRIORITY_LOW)
    try {
      expect(paste(editor(2), 'x\ty\nz\tw').defaultPrevented).toBe(true)
      expect(fallback).not.toHaveBeenCalled()
    } finally {
      canPaste.mockRestore()
      unregister()
    }
    expect(ref.current!.getMarkdown()).toBe(before)
    expect(history(parent).undoStack).toHaveLength(0)
    await waitFor(() => {
      expect(
        editor(2)
          .getEditorState()
          .read(() => $getRoot().getTextContent())
      ).toBe('c pendingx\ty\nz\tw')
    })
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

  it('lets an editable inline JSX editor inside a cell handle its own paste', async () => {
    const { cells, editor, container, ref } = await setup('| a | b |\n| - | - |\n| <Inline>inside</Inline> | d |')
    const element = container.querySelector<HTMLElement>('tbody [contenteditable="true"] [contenteditable="true"]')!
    expect(element).not.toBeNull()
    const nested = (element as HTMLElement & { __lexicalEditor: LexicalEditor }).__lexicalEditor
    expect(nested._parentEditor).toBe(editor(2))
    const before = ref.current!.getMarkdown()
    const fallback = vi.fn(() => true)
    const unregister = nested.registerCommand(PASTE_COMMAND, fallback, COMMAND_PRIORITY_LOW)
    expect(paste(nested, 'a\tb\nc\td').defaultPrevented).toBe(false)
    expect(fallback).toHaveBeenCalledOnce()
    expect(cells()).toHaveLength(4)
    expect(element.textContent).toBe('inside')
    expect(ref.current!.getMarkdown()).toBe(before)
    unregister()
  })

  it.each(['directive', 'jsx', 'multilevel'])(
    'keeps ordinary paste inside a %s table instead of coordinating shared histories',
    async (kind) => {
      const table = '| a | b |\n| - | - |\n| c | d |'
      const markdown =
        kind === 'directive'
          ? `:::note\n${table}\n:::`
          : kind === 'jsx'
            ? `<Box>\n\n${table}\n\n</Box>`
            : `:::note\n<Box>\n\n${table}\n\n</Box>\n:::`
      const { cells, editor, parent } = await setup(markdown)
      expect(parent._parentEditor).not.toBeNull()
      act(() => {
        editor(2).update(
          () => {
            $getRoot().selectEnd()
          },
          { discrete: true }
        )
      })
      paste(editor(2), 'x\ty\nz\tw')
      await waitFor(() => {
        expect(cells()[2].textContent).toContain('cx')
      })
      expect(cells()[2].textContent).toContain('w')
      expect(cells()).toHaveLength(4)
      expect([cells()[0].textContent, cells()[1].textContent, cells()[3].textContent]).toEqual(['a', 'b', 'd'])
    }
  )
})
