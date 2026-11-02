import { act, render, waitFor } from '@testing-library/react'
import {
  $isTextNode,
  CAN_UNDO_COMMAND,
  CAN_REDO_COMMAND,
  COMMAND_PRIORITY_CRITICAL,
  HISTORY_PUSH_TAG,
  BLUR_COMMAND,
  $createTextNode,
  $getRoot,
  REDO_COMMAND,
  UNDO_COMMAND,
  type LexicalEditor
} from 'lexical'
import React from 'react'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { MDXEditor, type MDXEditorMethods } from '../MDXEditor'
import { tablePlugin } from '../plugins/table'
import { toolbarPlugin } from '../plugins/toolbar'
import { UndoRedo } from '../plugins/toolbar/components/UndoRedo'
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

async function setup(markdown = '| a | b |\n| - | - |\n| c | d |', seedParent = true) {
  const ref = React.createRef<MDXEditorMethods>()
  const view = render(
    <MDXEditor ref={ref} markdown={markdown} plugins={[tablePlugin(), toolbarPlugin({ toolbarContents: () => <UndoRedo /> })]} />
  )
  const cells = () => Array.from(view.container.querySelectorAll<HTMLElement>('tbody [contenteditable="true"]'))
  await waitFor(() => {
    expect(cells().length).toBeGreaterThanOrEqual(4)
  })
  const editor = (index: number) => (cells()[index] as HTMLElement & { __lexicalEditor: LexicalEditor }).__lexicalEditor
  const parent = editor(0)._parentEditor!
  let root = parent
  while (root._parentEditor) root = root._parentEditor
  if (seedParent)
    act(() => {
      parent.update(
        () => {
          $getRoot().selectEnd()
        },
        { discrete: true, tag: 'skip-dom-selection' }
      )
    })
  return { ...view, ref, cells, editor, parent, root }
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

const table = '| a | b |\n| - | - |\n| c | d |'
const cases = [{ name: 'root', markdown: table }]
function blur(editor: LexicalEditor) {
  act(() => {
    editor.dispatchCommand(BLUR_COMMAND, new FocusEvent('blur', { relatedTarget: null }))
  })
}
describe('table persisted-content reconciliation', () => {
  it.each(cases)('restores mounted cells and Markdown after ordinary $name edit, blur, Undo and Redo', async ({ markdown }) => {
    const { cells, editor, parent, root, ref } = await setup(markdown)
    const before = ref.current!.getMarkdown()
    const mounted = editor(2)
    type(mounted, ' edited')
    blur(mounted)
    await waitFor(() => {
      expect(ref.current!.getMarkdown()).toContain('c edited')
    })
    const edited = ref.current!.getMarkdown()
    expect(history(parent).undoStack).toHaveLength(1)
    command(root)
    await waitFor(() => {
      expect({ text: cells()[2].textContent, markdown: ref.current!.getMarkdown() }).toEqual({ text: 'c', markdown: before })
    })
    expect(history(parent).redoStack).toHaveLength(1)
    // A later blur must not save the text which Undo just replaced.
    blur(editor(2))
    expect(ref.current!.getMarkdown()).toBe(before)
    expect(history(parent).redoStack).toHaveLength(1)
    command(root, true)
    await waitFor(() => {
      expect({ text: cells()[2].textContent, markdown: ref.current!.getMarkdown() }).toEqual({ text: 'c edited', markdown: edited })
    })
  })
  it.each(cases)('preserves unsaved sibling typing and local history during $name reconciliation', async ({ markdown }) => {
    const { cells, editor, root } = await setup(markdown)
    type(editor(2), ' committed')
    blur(editor(2))
    const sibling = editor(0)
    type(sibling, ' pending')
    command(root)
    await waitFor(() => {
      expect(cells()[2].textContent).toBe('c')
    })
    expect(cells()[0].textContent).toBe('a pending')
    expect(editor(0)).toBe(sibling)
    command(sibling)
    await waitFor(() => {
      expect(cells()[0].textContent).toBe('a')
    })
    command(sibling, true)
    await waitFor(() => {
      expect(cells()[0].textContent).toBe('a pending')
    })
    command(root, true)
    await waitFor(() => {
      expect(cells()[2].textContent).toBe('c committed')
    })
    expect(cells()[0].textContent).toBe('a pending')
    expect(editor(0)).toBe(sibling)
  })

  it('does not overwrite parent history availability while clearing a restored cell', async () => {
    const { cells, editor, root } = await setup('before\n\n' + table)
    act(() => {
      root.update(
        () => {
          const text = $getRoot().getFirstDescendant()
          if ($isTextNode(text)) text.setTextContent('changed')
        },
        { discrete: true, tag: HISTORY_PUSH_TAG }
      )
    })
    type(editor(2), ' committed')
    blur(editor(2))
    const cellAvailability: boolean[] = []
    const removeCell = editor(2).registerCommand(
      CAN_UNDO_COMMAND,
      (value) => {
        cellAvailability.push(value)
        return false
      },
      COMMAND_PRIORITY_CRITICAL
    )
    const undoAvailability: boolean[] = []
    const redoAvailability: boolean[] = []
    const removeUndo = root.registerCommand(
      CAN_UNDO_COMMAND,
      (value) => {
        undoAvailability.push(value)
        return false
      },
      COMMAND_PRIORITY_CRITICAL
    )
    const removeRedo = root.registerCommand(
      CAN_REDO_COMMAND,
      (value) => {
        redoAvailability.push(value)
        return false
      },
      COMMAND_PRIORITY_CRITICAL
    )
    command(root)
    await waitFor(() => {
      expect(cells()[2].textContent).toBe('c')
    })
    expect(history(root).undoStack.length).toBeGreaterThan(0)
    expect(history(root).redoStack.length).toBeGreaterThan(0)
    expect(undoAvailability).not.toContain(false)
    expect(redoAvailability.at(-1)).toBe(true)
    expect(cellAvailability).toContain(false)
    removeCell()
    removeUndo()
    removeRedo()
  })

  it('does not let a retained blur overwrite an authoritative parent Undo before reconciliation', async () => {
    const { cells, editor, root, ref } = await setup()
    const before = ref.current!.getMarkdown()
    type(editor(2), ' committed')
    blur(editor(2))
    act(() => {
      root.dispatchCommand(UNDO_COMMAND, undefined)
      root.update(() => undefined, { discrete: true })
      editor(2).dispatchCommand(BLUR_COMMAND, new FocusEvent('blur', { relatedTarget: null }))
    })
    await waitFor(() => {
      expect({ text: cells()[2].textContent, markdown: ref.current!.getMarkdown() }).toEqual({ text: 'c', markdown: before })
    })
  })
})
