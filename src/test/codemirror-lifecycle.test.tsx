import { EditorView, ViewPlugin } from '@codemirror/view'
import { act, render } from '@testing-library/react'
import { $getRoot, type LexicalEditor } from 'lexical'
import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MDXEditor } from '../MDXEditor'
import { codeBlockPlugin, $isCodeBlockNode } from '../plugins/codeblock'
import { codeMirrorPlugin, type CodeBlockLanguageSupport } from '../plugins/codemirror'
import { rootEditor$ } from '../plugins/core'

const loaders = vi.hoisted(() => ({ first: vi.fn(), second: vi.fn() }))
const rangeRectDescriptor = Object.getOwnPropertyDescriptor(Range.prototype, 'getBoundingClientRect')
const rangeRectsDescriptor = Object.getOwnPropertyDescriptor(Range.prototype, 'getClientRects')

vi.mock('@codemirror/language-data', () => ({
  languages: [
    { name: 'first', alias: [], extensions: [], load: loaders.first },
    { name: 'second', alias: [], extensions: [], load: loaders.second }
  ]
}))

function deferredSupport() {
  let resolve!: (support: CodeBlockLanguageSupport) => void
  let reject!: (reason: Error) => void
  const promise = new Promise<CodeBlockLanguageSupport>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  return { promise, resolve, reject }
}

function renderCodeBlock() {
  let editor!: LexicalEditor
  const created: EditorView[] = []
  const destroyed: EditorView[] = []
  const lifecycle = ViewPlugin.define((view) => {
    created.push(view)
    return { destroy: () => destroyed.push(view) }
  })
  const result = render(
    <MDXEditor
      markdown={'```first\noriginal code\n```'}
      plugins={[
        codeBlockPlugin(),
        codeMirrorPlugin({ codeBlockLanguages: { first: 'First', second: 'Second' }, codeMirrorExtensions: [lifecycle] }),
        { postInit: (realm) => (editor = realm.getValue(rootEditor$)!) }
      ]}
    />
  )
  const setLanguage = (language: string) => {
    act(() => {
      editor.update(
        () => {
          const node = $getRoot().getFirstChildOrThrow()
          if (!$isCodeBlockNode(node)) {
            throw new Error('Expected a code block')
          }
          node.setLanguage(language)
        },
        { discrete: true }
      )
    })
  }
  return { ...result, created, destroyed, setLanguage }
}

beforeEach(() => {
  vi.clearAllMocks()
  // CodeMirror measures selections, but jsdom does not implement Range geometry.
  Object.defineProperty(Range.prototype, 'getBoundingClientRect', { configurable: true, value: () => new DOMRect(0, 0, 100, 20) })
  Object.defineProperty(Range.prototype, 'getClientRects', { configurable: true, value: () => [] })
})

afterEach(() => {
  vi.restoreAllMocks()
  if (rangeRectDescriptor) Object.defineProperty(Range.prototype, 'getBoundingClientRect', rangeRectDescriptor)
  else Reflect.deleteProperty(Range.prototype, 'getBoundingClientRect')
  if (rangeRectsDescriptor) Object.defineProperty(Range.prototype, 'getClientRects', rangeRectsDescriptor)
  else Reflect.deleteProperty(Range.prototype, 'getClientRects')
})

describe('CodeMirror asynchronous language loading', () => {
  it('does not create an editor after its code block is unmounted', async () => {
    const first = deferredSupport()
    loaders.first.mockReturnValue(first.promise)
    const { unmount, created } = renderCodeBlock()
    expect(loaders.first).toHaveBeenCalledOnce()
    unmount()

    await act(async () => {
      first.resolve({ extension: [] })
      await first.promise
    })

    expect(created).toHaveLength(0)
  })

  it('does not replace the current editor when an older language finishes loading last', async () => {
    const first = deferredSupport()
    const second = deferredSupport()
    loaders.first.mockReturnValue(first.promise)
    loaders.second.mockReturnValue(second.promise)
    const { container, unmount, created, destroyed, setLanguage } = renderCodeBlock()
    setLanguage('second')
    expect(loaders.second).toHaveBeenCalledOnce()

    await act(async () => {
      second.resolve({ extension: [] })
      await second.promise
    })
    expect(created).toHaveLength(1)
    const currentView = created[0]
    act(() => {
      currentView.dispatch({ changes: { from: 0, to: currentView.state.doc.length, insert: 'newer edits' } })
    })

    await act(async () => {
      first.resolve({ extension: [] })
      await first.promise
    })

    expect(created).toHaveLength(1)
    expect(container.querySelector('.cm-editor')).toBe(currentView.dom)
    expect(currentView.state.doc.toString()).toBe('newer edits')
    unmount()
    expect(destroyed).toEqual([currentView])
  })

  it('does not create a fallback editor when a language load rejects after unmount', async () => {
    const first = deferredSupport()
    loaders.first.mockReturnValue(first.promise)
    const warning = vi.spyOn(console, 'warn')
    const { unmount, created } = renderCodeBlock()
    unmount()

    await act(async () => {
      first.reject(new Error('Language download failed'))
      await first.promise.catch(() => undefined)
    })

    expect(warning).toHaveBeenCalledWith('failed to load language support for', 'first')
    expect(created).toHaveLength(0)
  })
})
