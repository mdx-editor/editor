import React from 'react'
import { act, render } from '@testing-library/react'
import { undo, redo } from '@codemirror/commands'
import { EditorSelection, EditorState, type Extension } from '@codemirror/state'
import { EditorView } from '@codemirror/view'
import { Realm } from '@mdxeditor/gurx'
import { $getRoot } from 'lexical'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { MDXEditor, type MDXEditorMethods, diffSourcePlugin } from '../'
import { realmPlugin } from '../RealmWithPlugins'
import { rootEditor$, viewMode$ } from '../plugins/core'

// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

const rangeRectDescriptor = Object.getOwnPropertyDescriptor(Range.prototype, 'getClientRects')
beforeAll(() => {
  Object.defineProperty(Range.prototype, 'getClientRects', { configurable: true, value: () => [] })
})
afterAll(() => {
  if (rangeRectDescriptor) Object.defineProperty(Range.prototype, 'getClientRects', rangeRectDescriptor)
  else Reflect.deleteProperty(Range.prototype, 'getClientRects')
})

function setup(
  mode: 'source' | 'diff' | 'rich-text',
  markdown = 'Original rich text',
  startInMode = false,
  codeMirrorExtensions: Extension[] = []
) {
  const ref = React.createRef<MDXEditorMethods>()
  const onChange = vi.fn()
  let realm!: Realm
  const captureRealm = realmPlugin({
    init(r) {
      realm = r
    }
  })
  const result = render(
    <MDXEditor
      ref={ref}
      markdown={markdown}
      onChange={onChange}
      plugins={[
        diffSourcePlugin({ diffMarkdown: 'Unchanged comparison', viewMode: startInMode ? mode : 'rich-text', codeMirrorExtensions }),
        captureRealm()
      ]}
    />
  )
  act(() => {
    realm.getValue(rootEditor$)!.update(() => $getRoot().selectEnd(), { discrete: true })
    realm.pub(viewMode$, mode)
  })
  const getView = () => {
    const content = result.container.querySelector<HTMLElement>('.mdxeditor-source-editor .cm-content, .cm-merge-b .cm-content')!
    return EditorView.findFromDOM(content)!
  }
  return { ref, realm, view: mode === 'rich-text' ? null : getView(), getView, onChange, ...result }
}

describe.each(['source', 'diff'] as const)('insertMarkdown in %s mode', (mode) => {
  it('preserves source edits and inserts at the CodeMirror cursor', async () => {
    const { ref, getView, onChange } = setup(mode)
    const view = getView()
    act(() => {
      view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: 'Edited content' }, selection: { anchor: 7 } })
    })
    expect(ref.current!.getMarkdown()).toBe('Edited content')
    onChange.mockClear()
    await act(async () => {
      await Promise.resolve()
      ref.current!.insertMarkdown('new ')
    })
    expect(ref.current!.getMarkdown()).toBe('Edited new content')
    expect(view.state.doc.toString()).toBe('Edited new content')
    expect(view.state.selection.main.head).toBe(11)
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenLastCalledWith('Edited new content', false)
  })

  it('replaces the selection and preserves native undo and redo', () => {
    const { ref, getView } = setup(mode)
    const view = getView()
    act(() => {
      view.dispatch({ selection: { anchor: 9, head: 13 } })
    })
    act(() => {
      ref.current!.insertMarkdown('source')
    })
    expect(ref.current!.getMarkdown()).toBe('Original source text')
    expect(view.state.selection.main.head).toBe(15)
    act(() => {
      expect(undo(view)).toBe(true)
    })
    expect(ref.current!.getMarkdown()).toBe('Original rich text')
    act(() => {
      expect(redo(view)).toBe(true)
    })
    expect(ref.current!.getMarkdown()).toBe('Original source text')
  })

  it('inserts at each CodeMirror selection and supports consecutive calls', () => {
    const { ref, getView } = setup(mode, 'one two')
    const view = getView()
    act(() => {
      view.dispatch({ selection: EditorSelection.create([EditorSelection.cursor(0), EditorSelection.cursor(4)]) })
    })
    act(() => {
      ref.current!.insertMarkdown('A')
      ref.current!.insertMarkdown('B')
    })
    expect(ref.current!.getMarkdown()).toBe('ABone ABtwo')
    expect(view.state.selection.ranges.map(({ head }) => head)).toEqual([2, 8])
  })

  it('keeps raw source syntax and whitespace without importing it into Lexical', () => {
    const { ref, getView } = setup(mode, '')
    act(() => {
      ref.current!.insertMarkdown('  <unfinished>\n\n')
    })
    expect(ref.current!.getMarkdown()).toBe('  <unfinished>\n\n')
    expect(getView().state.doc.toString()).toBe('  <unfinished>\n\n')
  })

  it('synchronizes mode switches and removes old insertion subscriptions', async () => {
    const { ref, realm, getView, container } = setup(mode)
    act(() => {
      getView().dispatch({ changes: { from: 0, to: getView().state.doc.length, insert: 'Edited content' } })
    })
    act(() => {
      ref.current!.insertMarkdown('New ')
    })
    await act(async () => {
      await Promise.resolve()
      realm.pub(viewMode$, 'rich-text')
    })
    expect(ref.current!.getMarkdown()).toBe('New Edited content')
    expect(container.querySelector('.mdxeditor-rich-text-editor')).toHaveTextContent('New Edited content')
    for (const nextMode of ['source', 'diff', mode] as const) {
      await act(async () => {
        await Promise.resolve()
        realm.pub(viewMode$, nextMode)
      })
    }
    act(() => {
      ref.current!.insertMarkdown('Once ')
    })
    expect(ref.current!.getMarkdown()).toBe('Once New Edited content')
    if (mode === 'diff') {
      expect(container.querySelector('.cm-merge-a .cm-content')).toHaveTextContent('Unchanged comparison')
    }
  })

  it('does not apply a rich-text insertion to an outgoing CodeMirror view', async () => {
    const { ref, realm, getView } = setup(mode)
    const view = getView()
    const source = view.state.doc.toString()
    await act(async () => {
      await Promise.resolve()
      realm.pub(viewMode$, 'rich-text')
      ref.current!.insertMarkdown('!')
    })
    expect(view.state.doc.toString()).toBe(source)
    expect(ref.current!.getMarkdown()).toBe('Original rich text!')
  })

  it('supports an editor that starts in source mode and external setMarkdown', async () => {
    const { ref, getView } = setup(mode, 'Initial content', true)
    act(() => {
      ref.current!.insertMarkdown('First ')
    })
    expect(ref.current!.getMarkdown()).toBe('First Initial content')
    await act(async () => {
      ref.current!.setMarkdown('Replacement document')
      await Promise.resolve()
    })
    expect(ref.current!.getMarkdown()).toBe('Replacement document')
    expect(getView().state.doc.toString()).toBe('Replacement document')
    act(() => {
      ref.current!.insertMarkdown('Next ')
    })
    expect(ref.current!.getMarkdown()).toBe('Next Replacement document')
  })

  it('keeps raw source edits while moving between source and diff', async () => {
    const { ref, realm, getView } = setup(mode, '')
    act(() => {
      ref.current!.insertMarkdown('  <unfinished>\n\n')
    })
    await act(async () => {
      realm.pub(viewMode$, mode === 'source' ? 'diff' : 'source')
      await Promise.resolve()
    })
    expect(ref.current!.getMarkdown()).toBe('  <unfinished>\n\n')
    expect(getView().state.doc.toString()).toBe('  <unfinished>\n\n')
  })
})

describe.each(['source', 'diff'] as const)('immediate transition to %s', (mode) => {
  it('preserves an insertion before the source editor mounts', async () => {
    const { ref, realm } = setup('rich-text')
    await act(async () => {
      await Promise.resolve()
      realm.pub(viewMode$, mode)
      ref.current!.insertMarkdown('X')
      ref.current!.insertMarkdown('Y')
      expect(ref.current!.getMarkdown()).toBe('XYOriginal rich text')
    })
    expect(ref.current!.getMarkdown()).toBe('XYOriginal rich text')
  })

  it('restores the pending insertion cursor and undo history when mounted', async () => {
    const { ref, realm, getView } = setup('rich-text')
    await act(async () => {
      realm.pub(viewMode$, mode)
      ref.current!.insertMarkdown('Pending ')
      await Promise.resolve()
    })
    const view = getView()
    expect(view.state.selection.main.head).toBe(8)
    act(() => {
      expect(undo(view)).toBe(true)
    })
    expect(ref.current!.getMarkdown()).toBe('Original rich text')
    act(() => {
      expect(redo(view)).toBe(true)
    })
    expect(ref.current!.getMarkdown()).toBe('Pending Original rich text')
  })

  it('applies custom transaction filters before and after the view mounts', async () => {
    const rejectInsertion = EditorState.transactionFilter.of((transaction) => (transaction.docChanged ? [] : transaction))
    const { ref, realm } = setup('rich-text', 'Original rich text', false, [rejectInsertion])
    await act(async () => {
      realm.pub(viewMode$, mode)
      ref.current!.insertMarkdown('Rejected ')
      await Promise.resolve()
    })
    expect(ref.current!.getMarkdown()).toBe('Original rich text')
    act(() => {
      ref.current!.insertMarkdown('Also rejected ')
    })
    expect(ref.current!.getMarkdown()).toBe('Original rich text')
  })
})

describe('pending source insertions during mode changes', () => {
  it('keeps insertions when source mode is left before mounting', async () => {
    const { ref, realm } = setup('rich-text')
    await act(async () => {
      await Promise.resolve()
      realm.pub(viewMode$, 'source')
      ref.current!.insertMarkdown('A')
      realm.pub(viewMode$, 'rich-text')
    })
    expect(ref.current!.getMarkdown()).toBe('AOriginal rich text')
  })

  it('consumes pending insertions once and in order in the next source editor', async () => {
    const { ref, realm } = setup('rich-text')
    await act(async () => {
      await Promise.resolve()
      realm.pub(viewMode$, 'source')
      ref.current!.insertMarkdown('A')
      realm.pub(viewMode$, 'diff')
      ref.current!.insertMarkdown('B')
    })
    expect(ref.current!.getMarkdown()).toBe('ABOriginal rich text')
    await act(async () => {
      await Promise.resolve()
      realm.pub(viewMode$, 'source')
    })
    expect(ref.current!.getMarkdown()).toBe('ABOriginal rich text')
  })

  it('preserves inserted source content before a new rich-text insertion', async () => {
    const { ref, realm } = setup('rich-text')
    await act(async () => {
      await Promise.resolve()
      realm.pub(viewMode$, 'source')
      ref.current!.insertMarkdown('A')
      realm.pub(viewMode$, 'rich-text')
      realm.getValue(rootEditor$)!.update(() => $getRoot().selectEnd(), { discrete: true })
      ref.current!.insertMarkdown('B')
    })
    expect(ref.current!.getMarkdown()).toBe('AOriginal rich textB')
  })

  it('preserves source edits when inserting during a source-to-diff handoff', async () => {
    const { ref, realm, getView } = setup('source')
    act(() => {
      getView().dispatch({ changes: { from: 0, to: getView().state.doc.length, insert: 'Edited content' } })
    })
    await act(async () => {
      await Promise.resolve()
      realm.pub(viewMode$, 'diff')
      ref.current!.insertMarkdown('New ')
    })
    expect(ref.current!.getMarkdown()).toBe('New Edited content')
  })
})

describe('insertMarkdown in rich-text mode', () => {
  it('continues inserting into the Lexical selection', async () => {
    const { ref } = setup('rich-text')
    await act(async () => {
      await Promise.resolve()
      ref.current!.insertMarkdown('!')
    })
    expect(ref.current!.getMarkdown()).toBe('Original rich text!')
  })
})
