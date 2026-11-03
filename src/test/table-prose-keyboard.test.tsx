import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { $getRoot, COMMAND_PRIORITY_CRITICAL, KEY_DOWN_COMMAND, KEY_ENTER_COMMAND, type LexicalEditor } from 'lexical'
import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MDXEditor, type MDXEditorMethods } from '../MDXEditor'
import { rootEditor$ } from '../plugins/core'
import { tablePlugin } from '../plugins/table'

const markdown = 'Keyboard prose\n\n| First |\n| ----- |\n| One |'
const rangeRect = Object.getOwnPropertyDescriptor(Range.prototype, 'getBoundingClientRect')
const rangeRects = Object.getOwnPropertyDescriptor(Range.prototype, 'getClientRects')

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
  if (rangeRect) Object.defineProperty(Range.prototype, 'getBoundingClientRect', rangeRect)
  else Reflect.deleteProperty(Range.prototype, 'getBoundingClientRect')
  if (rangeRects) Object.defineProperty(Range.prototype, 'getClientRects', rangeRects)
  else Reflect.deleteProperty(Range.prototype, 'getClientRects')
})

async function setup() {
  let editor!: LexicalEditor
  const ref = React.createRef<MDXEditorMethods>()
  const view = render(
    <MDXEditor
      ref={ref}
      markdown={markdown}
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
  // Browser focus can leave the editor's last prose selection intact while a
  // decorator's menu button is focused. That selection must not receive Enter.
  act(() => {
    editor.update(
      () => {
        $getRoot().getFirstChildOrThrow().selectEnd()
      },
      { discrete: true }
    )
  })
  const menu = screen.getByRole('button', { name: 'Table menu' })
  act(() => {
    menu.focus()
  })
  const onKeyDown = vi.fn(() => false)
  const onEnter = vi.fn(() => false)
  const removeKeyDown = editor.registerCommand(KEY_DOWN_COMMAND, onKeyDown, COMMAND_PRIORITY_CRITICAL)
  const removeEnter = editor.registerCommand(KEY_ENTER_COMMAND, onEnter, COMMAND_PRIORITY_CRITICAL)
  const shape = () =>
    editor.getEditorState().read(() =>
      $getRoot()
        .getChildren()
        .map((node) => [node.getType(), node.getTextContent()])
    )
  return {
    menu,
    editor,
    ref,
    onKeyDown,
    onEnter,
    shape,
    dispose: () => {
      removeKeyDown()
      removeEnter()
    }
  }
}

describe('table prose menu keyboard event boundary', () => {
  it.each([
    ['Enter', 'Enter'],
    [' ', 'Space']
  ])('keeps %s activation out of parent editor commands without cancelling the button default', async (key, code) => {
    const v = await setup()
    const baseline = v.shape()
    const saved = v.ref.current!.getMarkdown()
    const event = new KeyboardEvent('keydown', { key, code, bubbles: true, cancelable: true })
    fireEvent(v.menu, event)

    expect(v.onKeyDown).not.toHaveBeenCalled()
    expect(v.onEnter).not.toHaveBeenCalled()
    expect(event.defaultPrevented).toBe(false)
    expect(v.menu).toHaveFocus()
    expect(v.shape()).toEqual(baseline)
    expect(v.ref.current!.getMarkdown()).toBe(saved)

    // jsdom does not synthesize a button's native keyboard click. Verify its
    // existing click path separately; the browser spec covers native activation.
    fireEvent.click(v.menu)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Insert paragraph before table' })).toHaveFocus()
    })
    expect(v.shape()).toEqual(baseline)
    v.dispose()
  })

  it('does not intercept Tab navigation or ordinary Enter in the parent prose editor', async () => {
    const v = await setup()
    const baseline = v.shape()
    const tab = new KeyboardEvent('keydown', { key: 'Tab', code: 'Tab', bubbles: true, cancelable: true })
    fireEvent(v.menu, tab)
    expect(v.onKeyDown).toHaveBeenCalledOnce()
    expect(tab.defaultPrevented).toBe(false)
    expect(v.shape()).toEqual(baseline)

    act(() => {
      v.editor.getRootElement()!.focus()
    })
    fireEvent.keyDown(v.editor.getRootElement()!, { key: 'Enter', code: 'Enter' })
    expect(v.onEnter).toHaveBeenCalledOnce()
    await waitFor(() => {
      expect(v.shape()).toHaveLength(baseline.length + 1)
    })
    v.dispose()
  })
})
