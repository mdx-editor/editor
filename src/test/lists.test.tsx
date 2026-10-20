import { act, render } from '@testing-library/react'
import React from 'react'
import { describe, expect, it } from 'vitest'
import { $createListItemNode, $createListNode } from '@lexical/list'
import { $createTextNode, $getRoot, type LexicalEditor } from 'lexical'
import { MDXEditor, realmPlugin, rootEditor$, type MDXEditorMethods } from '../'
import { listsPlugin } from '../plugins/lists'

// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

function roundTrip(markdown: string) {
  const ref = React.createRef<MDXEditorMethods>()
  render(<MDXEditor ref={ref} markdown={markdown} plugins={[listsPlugin()]} />)
  return ref.current!.getMarkdown().trim()
}

describe('ordered list start (#471)', () => {
  it('keeps a start number above one', () => {
    expect(roundTrip('3. three\n4. four')).toBe('3. three\n4. four')
  })

  it('keeps a start number of zero', () => {
    expect(roundTrip('0. zero\n1. one')).toBe('0. zero\n1. one')
  })

  it('keeps a large start number', () => {
    expect(roundTrip('42. x')).toBe('42. x')
  })

  it('keeps the start number of a nested ordered list', () => {
    expect(roundTrip('1. a\n\n   5. b\n   6. c')).toBe('1. a\n   5. b\n   6. c')
  })

  it('keeps lists that start at one unchanged', () => {
    expect(roundTrip('1. one\n2. two')).toBe('1. one\n2. two')
  })

  it('does not number bullet lists', () => {
    expect(roundTrip('* a\n* b')).toBe('* a\n* b')
  })

  it('does not number check lists', () => {
    expect(roundTrip('* [ ] a')).toBe('* [ ] a')
  })

  it('exports the start number of a list created in the editor', () => {
    let editor: LexicalEditor | null = null
    const captureEditor = realmPlugin({
      postInit(realm) {
        editor = realm.getValue(rootEditor$)
      }
    })
    const ref = React.createRef<MDXEditorMethods>()
    render(<MDXEditor ref={ref} markdown="" plugins={[listsPlugin(), captureEditor()]} />)
    act(() => {
      editor!.update(
        () => {
          const list = $createListNode('number', 7)
          const item = $createListItemNode()
          item.append($createTextNode('x'))
          list.append(item)
          $getRoot().clear().append(list)
        },
        { discrete: true }
      )
    })
    expect(ref.current!.getMarkdown().trim()).toBe('7. x')
  })
})
