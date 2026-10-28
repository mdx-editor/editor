import { act, fireEvent, render, waitFor } from '@testing-library/react'
import {
  HISTORY_PUSH_TAG,
  COMMAND_PRIORITY_LOW,
  BLUR_COMMAND,
  $createTextNode,
  $createParagraphNode,
  $getRoot,
  $getSelection,
  $isRangeSelection,
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
import { directivesPlugin } from '../plugins/directives'
import { AdmonitionDirectiveDescriptor } from '../directive-editors/AdmonitionDirectiveDescriptor'
import { jsxPlugin } from '../plugins/jsx'
import { isEditorHistoryRestoring } from '../plugins/core/lexicalExtensions'
import { useMdastNodeUpdater } from '../plugins/core/NestedLexicalEditor'
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

function PropertyTestEditor(props: React.ComponentProps<typeof GenericJsxEditor>) {
  const update = useMdastNodeUpdater()
  return (
    <>
      <button
        onClick={() => {
          update({ attributes: [{ type: 'mdxJsxAttribute', name: 'tone', value: 'updated' }] })
        }}
      >
        Set tone
      </button>
      <GenericJsxEditor {...props} />
    </>
  )
}

async function setup(markdown = '| a | b |\n| - | - |\n| c | d |', seedParent = true) {
  const ref = React.createRef<MDXEditorMethods>()
  const view = render(
    <MDXEditor
      ref={ref}
      markdown={markdown}
      plugins={[
        tablePlugin(),
        directivesPlugin({ directiveDescriptors: [AdmonitionDirectiveDescriptor] }),
        jsxPlugin({ jsxComponentDescriptors: [{ name: 'Box', kind: 'flow', props: [], hasChildren: true, Editor: PropertyTestEditor }] }),
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
const cases = [
  { name: 'root', markdown: table },
  { name: 'directive', markdown: `:::note\n${table}\n:::` },
  { name: 'jsx', markdown: `<Box>\n\n${table}\n\n</Box>` },
  { name: 'multilevel', markdown: `:::note\n<Box>\n\n${table}\n\n</Box>\n:::` }
]
function blur(editor: LexicalEditor) {
  act(() => {
    editor.dispatchCommand(BLUR_COMMAND, new FocusEvent('blur', { relatedTarget: null }))
  })
}
describe('nested editor committed history', () => {
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

  it.each(cases.slice(1))('records ordinary $name nested typing without a separate export Undo', async ({ markdown }) => {
    const { parent, root, ref } = await setup(markdown)
    const before = ref.current!.getMarkdown()
    act(() => {
      parent.update(
        () => {
          $getRoot().append($createParagraphNode().append($createTextNode('nested text')))
        },
        { discrete: true, tag: HISTORY_PUSH_TAG }
      )
    })
    blur(parent)
    await waitFor(() => {
      expect(ref.current!.getMarkdown()).toContain('nested text')
    })
    const edited = ref.current!.getMarkdown()
    expect(history(parent).undoStack).toHaveLength(1)
    command(root)
    await waitFor(() => {
      expect(ref.current!.getMarkdown()).toBe(before)
    })
    command(root, true)
    await waitFor(() => {
      expect(ref.current!.getMarkdown()).toBe(edited)
    })
  })

  it('does not steal focus or the unaffected cell selection while saving', async () => {
    const { cells, editor } = await setup(cases[3].markdown)
    type(editor(2), ' committed')
    const sibling = editor(0)
    // jsdom does not make contenteditable elements focusable by itself.
    cells()[0].tabIndex = 0
    act(() => {
      cells()[0].focus()
      sibling.focus()
    })
    await waitFor(() => {
      expect(cells()[0]).toHaveFocus()
    })
    const selection = () =>
      sibling.getEditorState().read(() => {
        const selected = $getSelection()
        return $isRangeSelection(selected) ? [selected.anchor.key, selected.anchor.offset, selected.focus.key, selected.focus.offset] : null
      })
    const before = selection()
    blur(editor(2))
    expect(cells()[0]).toHaveFocus()
    expect(selection()).toEqual(before)
  })
  it('starts new local edits from the authoritative state after parent Undo', async () => {
    const { cells, editor, root } = await setup()
    type(editor(2), ' committed')
    blur(editor(2))
    command(root)
    await waitFor(() => {
      expect(cells()[2].textContent).toBe('c')
    })
    act(() => {
      editor(2).update(
        () => {
          $getRoot().getLastDescendant()!.insertAfter($createTextNode(' new'))
        },
        { discrete: true, tag: HISTORY_PUSH_TAG }
      )
    })
    command(editor(2))
    await waitFor(() => {
      expect(cells()[2].textContent).toBe('c')
    })
  })
  it.each(cases)('can undo the first $name cell edit without prior parent interaction', async ({ markdown }) => {
    const { cells, editor, root, ref } = await setup(markdown, false)
    const before = ref.current!.getMarkdown()
    type(editor(2), ' first')
    blur(editor(2))
    expect(history(root).undoStack).toHaveLength(1)
    command(root)
    await waitFor(() => {
      expect({ text: cells()[2].textContent, markdown: ref.current!.getMarkdown() }).toEqual({ text: 'c', markdown: before })
    })
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
  it('keeps explicit JSX properties independently undoable after shared nested edits', async () => {
    const { editor, root, ref, getByText, cells } = await setup(cases[2].markdown)
    type(editor(2), ' committed')
    blur(editor(2))
    const contentOnly = ref.current!.getMarkdown()
    fireEvent.click(getByText('Set tone'))
    expect(ref.current!.getMarkdown()).toContain('tone="updated"')
    command(root)
    await waitFor(() => {
      expect(ref.current!.getMarkdown()).toBe(contentOnly)
    })
    expect(cells()[2].textContent).toBe('c committed')
    command(root, true)
    await waitFor(() => {
      expect(ref.current!.getMarkdown()).toContain('tone="updated"')
    })
    expect(cells()[2].textContent).toBe('c committed')
    const depth = history(root).undoStack.length
    fireEvent.click(getByText('Set tone'))
    expect(history(root).undoStack).toHaveLength(depth)
  })
  it.each(cases.slice(1))('keeps one Undo after focusing the root following a $name cell save', async ({ markdown }) => {
    const { cells, editor, root, ref } = await setup(markdown)
    const before = ref.current!.getMarkdown()
    type(editor(2), ' committed')
    blur(editor(2))
    act(() => {
      root.update(
        () => {
          $getRoot().selectEnd()
        },
        { discrete: true }
      )
    })
    expect(history(root).undoStack).toHaveLength(1)
    command(root)
    await waitFor(() => {
      expect({ text: cells()[2].textContent, markdown: ref.current!.getMarkdown() }).toEqual({ text: 'c', markdown: before })
    })
    command(root, true)
    await waitFor(() => {
      expect(cells()[2].textContent).toBe('c committed')
      expect(ref.current!.getMarkdown()).toContain('c committed')
    })
  })

  it.each(cases.slice(1))('restores $name nested state when history restores an ancestor snapshot', async ({ markdown }) => {
    const { parent, root, ref } = await setup(markdown, false)
    act(() => {
      root.update(
        () => {
          $getRoot().selectEnd()
        },
        { discrete: true }
      )
    })
    const before = ref.current!.getMarkdown()
    act(() => {
      parent.update(
        () => {
          $getRoot().append($createParagraphNode().append($createTextNode('nested text')))
        },
        { discrete: true, tag: HISTORY_PUSH_TAG }
      )
    })
    blur(parent)
    command(root)
    await waitFor(() => {
      expect(ref.current!.getMarkdown()).toBe(before)
      expect(parent.getRootElement()).not.toHaveTextContent('nested text')
    })
    command(root, true)
    await waitFor(() => {
      expect(ref.current!.getMarkdown()).toContain('nested text')
      expect(parent.getRootElement()).toHaveTextContent('nested text')
    })
  })
  it.each(cases.slice(1))('undoes repeated $name edit and root focus cycles without context-only steps', async ({ markdown }) => {
    const { cells, editor, root } = await setup(markdown)
    for (const suffix of [' one', ' two']) {
      type(editor(2), suffix)
      blur(editor(2))
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
      expect(cells()[2].textContent).toBe('c one')
    })
    command(root)
    await waitFor(() => {
      expect(cells()[2].textContent).toBe('c')
    })
    command(root, true)
    await waitFor(() => {
      expect(cells()[2].textContent).toBe('c one')
    })
    command(root, true)
    await waitFor(() => {
      expect(cells()[2].textContent).toBe('c one two')
    })
  })
  it('does not commit a focused sibling when parent Redo transiently restores root focus', async () => {
    const { cells, editor, root } = await setup(cases[3].markdown)
    type(editor(2), ' committed')
    blur(editor(2))
    act(() => {
      root.update(
        () => {
          $getRoot().selectEnd()
        },
        { discrete: true }
      )
    })
    const sibling = editor(0)
    type(sibling, ' pending')
    cells()[0].tabIndex = 0
    root.getRootElement()!.tabIndex = 0
    act(() => {
      cells()[0].focus()
    })
    command(root)
    await waitFor(() => {
      expect(cells()[2].textContent).toBe('c')
      expect(cells()[0]).toHaveFocus()
    })
    // Model the DOM focus/blur that native setEditorState produces before its
    // update listeners run; the browser suite exercises the native sequence.
    const unregister = root.registerCommand(
      REDO_COMMAND,
      () => {
        root.getRootElement()!.focus()
        sibling.dispatchCommand(BLUR_COMMAND, new FocusEvent('blur', { relatedTarget: root.getRootElement() }))
        return false
      },
      COMMAND_PRIORITY_LOW
    )
    command(root, true)
    unregister()
    await waitFor(() => {
      expect(cells()[2].textContent).toBe('c committed')
      expect(cells()[0].textContent).toBe('a pending')
      expect(cells()[0]).toHaveFocus()
    })
    expect(editor(0)).toBe(sibling)
  })
  it('does not mark root history as restoring for a cell-local Undo', async () => {
    const { cells, editor, root } = await setup()
    type(editor(2), ' committed')
    blur(editor(2))
    type(editor(0), ' local')
    cells()[0].tabIndex = 0
    act(() => {
      cells()[0].focus()
    })
    command(editor(0))
    expect(isEditorHistoryRestoring(root)).toBe(false)
  })
})
