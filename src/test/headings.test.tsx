import { $createHeadingNode, $isHeadingNode } from '@lexical/rich-text'
import { act, render } from '@testing-library/react'
import { $createLineBreakNode, $createTextNode, $getRoot, $getSelection, $isRangeSelection, type LexicalEditor } from 'lexical'
import React from 'react'
import { describe, expect, it } from 'vitest'
import { MDXEditor, type MDXEditorMethods } from '../'
import { rootEditor$ } from '../plugins/core'
import { headingsPlugin } from '../plugins/headings'
import { realmPlugin } from '../RealmWithPlugins'

// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

function captureRootEditor() {
  let editor: LexicalEditor | null = null
  const plugin = realmPlugin({
    postInit(realm) {
      editor = realm.getValue(rootEditor$)
    }
  })
  return {
    plugin,
    getEditor() {
      if (editor === null) {
        throw new Error('root editor was not captured')
      }
      return editor
    }
  }
}

function readTopLevelBlocks(editor: LexicalEditor) {
  return editor.getEditorState().read(() => {
    return $getRoot()
      .getChildren()
      .map((node) => ({
        type: $isHeadingNode(node) ? node.getTag() : node.getType(),
        text: node.getTextContent()
      }))
  })
}

describe('heading split with line break', () => {
  it('keeps heading type on the original text when splitting after Shift+Enter', () => {
    const captured = captureRootEditor()
    const ref = React.createRef<MDXEditorMethods>()

    render(<MDXEditor ref={ref} markdown="" plugins={[headingsPlugin(), captured.plugin()]} />)

    const editor = captured.getEditor()

    act(() => {
      editor.update(
        () => {
          const second = $createTextNode('second')
          $getRoot()
            .clear()
            .append($createHeadingNode('h1').append($createTextNode('first'), $createLineBreakNode(), second))
          second.select(0, 0)
          const selection = $getSelection()
          if ($isRangeSelection(selection)) {
            // KEY_ENTER / INSERT_PARAGRAPH_COMMAND both end in selection.insertParagraph().
            // Discrete so jsdom does not discard the nested update before we assert.
            selection.insertParagraph()
          }
        },
        { discrete: true }
      )
    })

    expect(readTopLevelBlocks(editor)).toEqual([
      { type: 'h1', text: 'first' },
      { type: 'paragraph', text: 'second' }
    ])
    expect(ref.current?.getMarkdown().trim()).toBe('# first\n\nsecond')
  })

  it('inserts a paragraph before a heading when Enter is pressed at the start', () => {
    const captured = captureRootEditor()
    render(<MDXEditor markdown="" plugins={[headingsPlugin(), captured.plugin()]} />)
    const editor = captured.getEditor()

    act(() => {
      editor.update(
        () => {
          const text = $createTextNode('title')
          $getRoot().clear().append($createHeadingNode('h1').append(text))
          text.select(0, 0)
          const selection = $getSelection()
          if ($isRangeSelection(selection)) {
            selection.insertParagraph()
          }
        },
        { discrete: true }
      )
    })

    expect(readTopLevelBlocks(editor)).toEqual([
      { type: 'paragraph', text: '' },
      { type: 'h1', text: 'title' }
    ])
  })

  it('inserts a paragraph after a heading when Enter is pressed at the end', () => {
    const captured = captureRootEditor()
    render(<MDXEditor markdown="" plugins={[headingsPlugin(), captured.plugin()]} />)
    const editor = captured.getEditor()

    act(() => {
      editor.update(
        () => {
          const text = $createTextNode('title')
          $getRoot().clear().append($createHeadingNode('h1').append(text))
          text.select(5, 5)
          const selection = $getSelection()
          if ($isRangeSelection(selection)) {
            selection.insertParagraph()
          }
        },
        { discrete: true }
      )
    })

    expect(readTopLevelBlocks(editor)).toEqual([
      { type: 'h1', text: 'title' },
      { type: 'paragraph', text: '' }
    ])
  })
})
