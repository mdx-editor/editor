import React from 'react'
import { act, fireEvent, render, waitFor } from '@testing-library/react'
import { undo, redo, isolateHistory } from '@codemirror/commands'
import { getChunks, goToNextChunk } from '@codemirror/merge'
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
  codeMirrorExtensions: Extension[] = [],
  strictMode = false,
  diffMarkdown = 'Unchanged comparison'
) {
  const ref = React.createRef<MDXEditorMethods>()
  const onChange = vi.fn()
  const onError = vi.fn()
  let realm!: Realm
  const captureRealm = realmPlugin({
    init(r) {
      realm = r
    }
  })
  const Wrapper = strictMode ? React.StrictMode : React.Fragment
  const result = render(
    <Wrapper>
      <MDXEditor
        ref={ref}
        markdown={markdown}
        onChange={onChange}
        onError={onError}
        plugins={[diffSourcePlugin({ diffMarkdown, viewMode: startInMode ? mode : 'rich-text', codeMirrorExtensions }), captureRealm()]}
      />
    </Wrapper>
  )
  act(() => {
    realm.getValue(rootEditor$)!.update(() => $getRoot().selectEnd(), { discrete: true })
    realm.pub(viewMode$, mode)
  })
  const getView = () => {
    const content = result.container.querySelector<HTMLElement>('.mdxeditor-source-editor .cm-content, .cm-merge-b .cm-content')!
    return EditorView.findFromDOM(content)!
  }
  return { ref, realm, view: mode === 'rich-text' ? null : getView(), getView, onChange, onError, ...result }
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

  it('resets to the last rich-text value after switching source views', async () => {
    const { ref, realm, getView, onChange } = setup(mode, 'A')
    act(() => {
      getView().dispatch({ changes: { from: 0, to: 1, insert: 'B' } })
    })
    await act(async () => {
      realm.pub(viewMode$, mode === 'source' ? 'diff' : 'source')
      await Promise.resolve()
    })
    onChange.mockClear()
    await act(async () => {
      ref.current!.setMarkdown('A')
      await Promise.resolve()
    })
    expect(ref.current!.getMarkdown()).toBe('A')
    expect(getView().state.doc.toString()).toBe('A')
    expect(onChange).not.toHaveBeenCalled()
  })

  it('sets raw Markdown directly without rich-text normalization', async () => {
    const { ref, realm, getView, onChange, onError } = setup(mode, 'A')
    onChange.mockClear()
    const replacement = '  <unfinished>\n\n'
    await act(async () => {
      ref.current!.setMarkdown(replacement)
      await Promise.resolve()
    })
    expect(ref.current!.getMarkdown()).toBe(replacement)
    expect(getView().state.doc.toString()).toBe(replacement)
    expect(onChange).not.toHaveBeenCalled()
    expect(onError).not.toHaveBeenCalled()
    await act(async () => {
      realm.pub(viewMode$, mode === 'source' ? 'diff' : 'source')
      await Promise.resolve()
    })
    expect(onError).not.toHaveBeenCalled()
    await act(async () => {
      realm.pub(viewMode$, 'rich-text')
      await Promise.resolve()
    })
    expect(onError).toHaveBeenCalledTimes(1)
  })

  it('compares setMarkdown against the current source value including whitespace', async () => {
    const { ref, getView } = setup(mode, 'A')
    await act(async () => {
      ref.current!.setMarkdown(' A\n')
      await Promise.resolve()
    })
    expect(ref.current!.getMarkdown()).toBe(' A\n')
    expect(getView().state.doc.toString()).toBe(' A\n')
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

  it('restores the pending selection and history through StrictMode remounts', async () => {
    const { ref, realm, getView } = setup('rich-text', 'Original rich text', false, [], true)
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

  it('uses the outgoing source cursor and history for an immediate insertion', async () => {
    const { ref, realm, getView } = setup(mode === 'source' ? 'diff' : 'source', 'A')
    act(() => {
      getView().dispatch({
        changes: { from: 1, insert: 'B' },
        selection: { anchor: 2 },
        annotations: isolateHistory.of('after')
      })
    })
    await act(async () => {
      realm.pub(viewMode$, mode)
      ref.current!.insertMarkdown('X')
      await Promise.resolve()
    })
    const view = getView()
    expect(ref.current!.getMarkdown()).toBe('ABX')
    expect(view.state.selection.main.head).toBe(3)
    act(() => {
      expect(undo(view)).toBe(true)
    })
    expect(ref.current!.getMarkdown()).toBe('AB')
    act(() => {
      expect(undo(view)).toBe(true)
    })
    expect(ref.current!.getMarkdown()).toBe('A')
  })

  it('replaces an old pending snapshot with the mounted view latest selection', async () => {
    const { ref, realm, getView } = setup('rich-text', 'A')
    await act(async () => {
      realm.pub(viewMode$, mode === 'source' ? 'diff' : 'source')
      ref.current!.insertMarkdown('B')
      await Promise.resolve()
    })
    act(() => {
      getView().dispatch({ selection: { anchor: 2 } })
    })
    await act(async () => {
      realm.pub(viewMode$, mode)
      ref.current!.insertMarkdown('X')
      await Promise.resolve()
    })
    expect(ref.current!.getMarkdown()).toBe('BAX')
    expect(getView().state.selection.main.head).toBe(3)
  })

  it('does not restore stale pending state after setMarkdown during a handoff', async () => {
    const { ref, realm, getView } = setup('rich-text', 'A')
    await act(async () => {
      realm.pub(viewMode$, mode)
      ref.current!.insertMarkdown('Pending ')
      ref.current!.setMarkdown('A')
      await Promise.resolve()
    })
    expect(ref.current!.getMarkdown()).toBe('A')
    expect(getView().state.doc.toString()).toBe('A')
    expect(getView().state.selection.main.head).toBe(0)
    act(() => {
      expect(undo(getView())).toBe(false)
    })
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

describe.each(['source', 'diff'] as const)('source view reuse during batched %s mode changes', (mode) => {
  it('keeps raw and mounted documents synchronized after an unmounted round-trip', async () => {
    const { ref, realm, getView } = setup(mode, 'A')
    act(() => {
      getView().dispatch({ selection: { anchor: 1 } })
    })
    await act(async () => {
      realm.pub(viewMode$, mode === 'source' ? 'diff' : 'source')
      ref.current!.insertMarkdown('B')
      realm.pub(viewMode$, mode)
      await Promise.resolve()
    })
    expect(ref.current!.getMarkdown()).toBe('AB')
    expect(getView().state.doc.toString()).toBe('AB')
    expect(getView().state.selection.main.head).toBe(2)
  })

  it('keeps insertions ordered during an unmounted round-trip', async () => {
    const { ref, realm, getView } = setup(mode, 'A')
    act(() => {
      getView().dispatch({ selection: { anchor: 1 } })
    })
    await act(async () => {
      realm.pub(viewMode$, mode === 'source' ? 'diff' : 'source')
      ref.current!.insertMarkdown('B')
      realm.pub(viewMode$, mode)
      ref.current!.insertMarkdown('C')
      await Promise.resolve()
    })
    expect(ref.current!.getMarkdown()).toBe('ABC')
    expect(getView().state.doc.toString()).toBe('ABC')
  })

  it('preserves setMarkdown during an unmounted round-trip', async () => {
    const { ref, realm, getView } = setup(mode, 'A')
    await act(async () => {
      realm.pub(viewMode$, mode === 'source' ? 'diff' : 'source')
      ref.current!.setMarkdown('B')
      realm.pub(viewMode$, mode)
      await Promise.resolve()
    })
    expect(ref.current!.getMarkdown()).toBe('B')
    expect(getView().state.doc.toString()).toBe('B')
  })

  it('keeps a pending same-document replacement selection when reusing the view', async () => {
    const { ref, realm, getView } = setup(mode, 'A')
    act(() => {
      getView().dispatch({ selection: { anchor: 0, head: 1 } })
    })
    await act(async () => {
      realm.pub(viewMode$, mode === 'source' ? 'diff' : 'source')
      ref.current!.insertMarkdown('A')
      realm.pub(viewMode$, mode)
      await Promise.resolve()
    })
    expect(getView().state.selection.main.empty).toBe(true)
    expect(getView().state.selection.main.head).toBe(1)
    act(() => {
      ref.current!.insertMarkdown('B')
    })
    expect(ref.current!.getMarkdown()).toBe('AB')
  })

  it('preserves undo history and transaction filters on the reused view', async () => {
    const rejectX = EditorState.transactionFilter.of((transaction) => (transaction.newDoc.toString().includes('X') ? [] : transaction))
    const { ref, realm, getView } = setup(mode, 'A', false, [rejectX])
    act(() => {
      getView().dispatch({
        changes: { from: 1, insert: 'B' },
        selection: { anchor: 2 },
        annotations: isolateHistory.of('after')
      })
    })
    await act(async () => {
      realm.pub(viewMode$, mode === 'source' ? 'diff' : 'source')
      ref.current!.insertMarkdown('C')
      realm.pub(viewMode$, mode)
      ref.current!.insertMarkdown('X')
      await Promise.resolve()
    })
    expect(ref.current!.getMarkdown()).toBe('ABC')
    expect(getView().state.doc.toString()).toBe('ABC')
    act(() => {
      expect(undo(getView())).toBe(true)
    })
    expect(ref.current!.getMarkdown()).toBe('AB')
    act(() => {
      expect(undo(getView())).toBe(true)
    })
    expect(ref.current!.getMarkdown()).toBe('A')
    act(() => {
      expect(redo(getView())).toBe(true)
    })
    act(() => {
      expect(redo(getView())).toBe(true)
    })
    expect(ref.current!.getMarkdown()).toBe('ABC')
  })

  it('supports setMarkdown called synchronously from onChange', async () => {
    const ref = React.createRef<MDXEditorMethods>()
    const errors: unknown[] = []
    const spy = vi.spyOn(console, 'error').mockImplementation((...args) => errors.push(args))
    const result = render(
      <MDXEditor
        ref={ref}
        markdown="A"
        onChange={(markdown) => {
          if (markdown === 'AB') ref.current!.setMarkdown('AC')
        }}
        plugins={[diffSourcePlugin({ viewMode: mode })]}
      />
    )
    const getView = () =>
      EditorView.findFromDOM(result.container.querySelector<HTMLElement>('.mdxeditor-source-editor .cm-content, .cm-merge-b .cm-content')!)!
    await act(async () => {
      getView().dispatch({ changes: { from: 1, insert: 'B' } })
      await Promise.resolve()
    })
    spy.mockRestore()
    expect(errors).toEqual([])
    expect(ref.current!.getMarkdown()).toBe('AC')
    expect(getView().state.doc.toString()).toBe('AC')
  })
})

describe('diff metadata during batched mode changes', () => {
  it('updates both sides chunks for insertion, undo and redo when the original view is reused', async () => {
    const { ref, realm, getView, container } = setup('diff', 'Unchanged comparison')
    const comparison = EditorView.findFromDOM(container.querySelector<HTMLElement>('.cm-merge-a .cm-content')!)!
    const expectChunks = (count: number) => {
      expect(getChunks(getView().state)!.chunks).toHaveLength(count)
      expect(getChunks(comparison.state)!.chunks).toBe(getChunks(getView().state)!.chunks)
    }
    expectChunks(0)
    act(() => {
      getView().dispatch({ selection: { anchor: getView().state.doc.length } })
    })
    await act(async () => {
      realm.pub(viewMode$, 'source')
      ref.current!.insertMarkdown(' changed')
      realm.pub(viewMode$, 'diff')
      await Promise.resolve()
    })
    expect(ref.current!.getMarkdown()).toBe('Unchanged comparison changed')
    expectChunks(1)
    act(() => {
      expect(undo(getView())).toBe(true)
    })
    expect(ref.current!.getMarkdown()).toBe('Unchanged comparison')
    expectChunks(0)
    act(() => {
      expect(redo(getView())).toBe(true)
    })
    expect(ref.current!.getMarkdown()).toBe('Unchanged comparison changed')
    expectChunks(1)
  })

  it('clears both sides chunks when a handoff replacement makes the documents equal', async () => {
    const { ref, realm, getView, container } = setup('diff', 'A')
    const comparison = EditorView.findFromDOM(container.querySelector<HTMLElement>('.cm-merge-a .cm-content')!)!
    expect(getChunks(getView().state)!.chunks).toHaveLength(1)
    await act(async () => {
      realm.pub(viewMode$, 'source')
      ref.current!.setMarkdown('Unchanged comparison')
      realm.pub(viewMode$, 'diff')
      await Promise.resolve()
    })
    expect(ref.current!.getMarkdown()).toBe('Unchanged comparison')
    expect(getView().state.doc.toString()).toBe('Unchanged comparison')
    expect(getChunks(getView().state)!.chunks).toHaveLength(0)
    expect(getChunks(comparison.state)!.chunks).toHaveLength(0)
  })

  it('navigates and reverts the current chunk after a batched source edit', async () => {
    const markdown = 'Header\n\nBody'
    const { ref, realm, getView, container } = setup('diff', markdown, false, [], false, markdown)
    act(() => {
      getView().dispatch({ selection: { anchor: markdown.length } })
    })
    await act(async () => {
      realm.pub(viewMode$, 'source')
      ref.current!.insertMarkdown(' changed')
      realm.pub(viewMode$, 'diff')
      await Promise.resolve()
    })
    const chunks = getChunks(getView().state)!.chunks
    expect(chunks).toHaveLength(1)
    act(() => {
      getView().dispatch({ selection: { anchor: 0 } })
      expect(goToNextChunk(getView())).toBe(true)
    })
    expect(getView().state.selection.main.head).toBe(chunks[0].fromB)
    await waitFor(() => {
      expect(container.querySelector('.cm-merge-revert button')).not.toBeNull()
    })
    act(() => {
      fireEvent.mouseDown(container.querySelector('.cm-merge-revert button')!)
    })
    expect(ref.current!.getMarkdown()).toBe(markdown)
    expect(getChunks(getView().state)!.chunks).toHaveLength(0)
    await waitFor(() => {
      expect(container.querySelector('.cm-merge-revert button')).toBeNull()
    })
  })
})
