import React from 'react'
import { describe, expect, it } from 'vitest'
import { registerMarkdownShortcuts, type ElementTransformer, type Transformer } from '@lexical/markdown'
import { $isHeadingNode, HeadingNode } from '@lexical/rich-text'
import { $createParagraphNode, $createTextNode, $getRoot, $getSelection, $isRangeSelection, createEditor } from 'lexical'
import { Realm } from '@mdxeditor/gurx'
import { composerChildren$, nestedEditorChildren$, tableCellEditorChildren$ } from '../plugins/core'
import { ALL_HEADING_LEVELS, headingsPlugin, type HEADING_LEVEL } from '../plugins/headings'
import { markdownShortcutPlugin } from '../plugins/markdown-shortcut'

const editorChildren = [
  { name: 'root', cell: composerChildren$ },
  { name: 'nested', cell: nestedEditorChildren$ },
  { name: 'table cell', cell: tableCellEditorChildren$ }
]

function headingShortcutTransformer(allowedHeadingLevels: readonly HEADING_LEVEL[] | undefined, cell = composerChildren$) {
  const realm = new Realm()

  headingsPlugin({ allowedHeadingLevels }).init?.(realm)
  markdownShortcutPlugin().init?.(realm)

  const ShortcutChild = realm.getValue(cell)[0] as () => React.ReactElement<{ transformers: Transformer[] }>
  const shortcutElement = ShortcutChild()
  return shortcutElement.props.transformers.find((transformer): transformer is ElementTransformer => {
    return (
      'regExp' in transformer &&
      'dependencies' in transformer &&
      transformer.dependencies.includes(HeadingNode) &&
      transformer.type === 'element'
    )
  })
}

describe.each(editorChildren)('markdownShortcutPlugin in $name editors', ({ cell }) => {
  it('uses configured heading levels during plugin initialization', () => {
    const transformer = headingShortcutTransformer([1, 2], cell)

    expect(transformer).toBeDefined()
    expect('# ').toMatch(transformer!.regExp)
    expect('## ').toMatch(transformer!.regExp)
    expect('### ').not.toMatch(transformer!.regExp)
  })

  it.each<{ levels: readonly HEADING_LEVEL[] }>([
    { levels: [2, 4] },
    { levels: [4, 2] },
    { levels: [1, 3, 5] },
    { levels: [3] },
    { levels: [2, 2, 4] },
    { levels: ALL_HEADING_LEVELS }
  ])('only enables the explicitly allowed heading levels: $levels', ({ levels }) => {
    const transformer = headingShortcutTransformer(levels, cell)
    expect(transformer).toBeDefined()
    const regExp = transformer!.regExp

    for (const level of ALL_HEADING_LEVELS) {
      const marker = '#'.repeat(level)
      expect(regExp.exec(marker + ' ')?.[1]).toBe(levels.includes(level) ? marker : undefined)
      expect(regExp.test(marker)).toBe(false)
      expect(regExp.test(marker + 'text')).toBe(false)
    }
    expect('####### ').not.toMatch(regExp)
    expect(' ').not.toMatch(regExp)
  })

  it('enables all heading levels by default', () => {
    const transformer = headingShortcutTransformer(undefined, cell)
    expect(transformer).toBeDefined()
    for (const level of ALL_HEADING_LEVELS) {
      expect('#'.repeat(level) + ' ').toMatch(transformer!.regExp)
    }
  })

  it('does not register heading shortcuts when no heading levels are allowed', () => {
    expect(headingShortcutTransformer([], cell)).toBeUndefined()
  })
})

describe('heading shortcut transformation', () => {
  it.each(ALL_HEADING_LEVELS)('only transforms explicitly allowed h%i while typing', async (level) => {
    const transformer = headingShortcutTransformer([2, 4])!
    const editor = createEditor({
      namespace: 'heading-shortcut-test',
      nodes: [HeadingNode],
      onError(error) {
        throw error
      }
    })
    const unregister = registerMarkdownShortcuts(editor, [transformer])
    try {
      const marker = '#'.repeat(level)
      editor.update(
        () => {
          const text = $createTextNode(marker)
          $getRoot().append($createParagraphNode().append(text))
          text.selectEnd()
        },
        { discrete: true }
      )
      editor.update(
        () => {
          const selection = $getSelection()
          if ($isRangeSelection(selection)) {
            selection.insertText(' ')
          }
        },
        { discrete: true }
      )
      await Promise.resolve()

      editor.getEditorState().read(() => {
        const block = $getRoot().getFirstChild()!
        if (level === 2 || level === 4) {
          expect($isHeadingNode(block) && block.getTag()).toBe(`h${level}`)
          expect(block.getTextContent()).toBe('')
        } else {
          expect(block.getType()).toBe('paragraph')
          expect(block.getTextContent()).toBe(marker + ' ')
        }
      })
    } finally {
      unregister()
    }
  })
})
