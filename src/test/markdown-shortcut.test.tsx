import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { act, render } from '@testing-library/react'
import { QUOTE, registerMarkdownShortcuts, type ElementTransformer, type Transformer } from '@lexical/markdown'
import { $isHeadingNode, HeadingNode } from '@lexical/rich-text'
import { $createParagraphNode, $createTextNode, $getRoot, $getSelection, $isRangeSelection, createEditor } from 'lexical'
import { Realm, RealmContext } from '@mdxeditor/gurx'
import { composerChildren$, tableCellEditorChildren$ } from '../plugins/core'
import { ALL_HEADING_LEVELS, headingsPlugin, type HEADING_LEVEL } from '../plugins/headings'
import { markdownShortcutPlugin } from '../plugins/markdown-shortcut'
import { quotePlugin } from '../plugins/quote'

const renderedTransformers = vi.hoisted(() => [] as Transformer[][])

// The Lexical plugin needs a composer; only the transformers it receives matter here.
vi.mock('@lexical/react/LexicalMarkdownShortcutPlugin', () => ({
  MarkdownShortcutPlugin: ({ transformers }: { transformers: Transformer[] }) => {
    renderedTransformers.push(transformers)
    return null
  }
}))

const editorChildren = [
  { name: 'root', cell: composerChildren$ },
  { name: 'table cell', cell: tableCellEditorChildren$ }
]

function findHeadingTransformer(transformers: Transformer[]) {
  return transformers.find((transformer): transformer is ElementTransformer => {
    return (
      'regExp' in transformer &&
      'dependencies' in transformer &&
      transformer.dependencies.includes(HeadingNode) &&
      transformer.type === 'element'
    )
  })
}

function renderShortcuts(allowedHeadingLevels: readonly HEADING_LEVEL[] | undefined, cell = composerChildren$) {
  const realm = new Realm()

  headingsPlugin({ allowedHeadingLevels }).init?.(realm)
  markdownShortcutPlugin().init?.(realm)

  const ShortcutChild = realm.getValue(cell)[0] as React.ComponentType
  renderedTransformers.length = 0
  render(
    <RealmContext.Provider value={realm}>
      <ShortcutChild />
    </RealmContext.Provider>
  )
  return {
    realm,
    transformers: () => renderedTransformers[renderedTransformers.length - 1]
  }
}

function headingShortcutTransformer(allowedHeadingLevels: readonly HEADING_LEVEL[] | undefined, cell = composerChildren$) {
  return findHeadingTransformer(renderShortcuts(allowedHeadingLevels, cell).transformers())
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

  it('follows heading level updates after initialization', () => {
    const { realm, transformers } = renderShortcuts([2, 4], cell)

    act(() => {
      headingsPlugin({ allowedHeadingLevels: [3] }).update?.(realm)
    })
    const updated = findHeadingTransformer(transformers())
    expect('### ').toMatch(updated!.regExp)
    expect('## ').not.toMatch(updated!.regExp)

    act(() => {
      headingsPlugin({ allowedHeadingLevels: [] }).update?.(realm)
    })
    expect(findHeadingTransformer(transformers())).toBeUndefined()
  })

  it('keeps the transformers when the same heading levels are republished', () => {
    const { realm, transformers } = renderShortcuts([2, 4], cell)
    const initial = transformers()

    act(() => {
      headingsPlugin({ allowedHeadingLevels: [2, 4] }).update?.(realm)
    })
    expect(transformers()).toBe(initial)
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

describe('markdownShortcutPlugin plugin ordering', () => {
  it('picks up plugins that are initialized after it', () => {
    const realm = new Realm()
    markdownShortcutPlugin().init?.(realm)
    quotePlugin().init?.(realm)
    headingsPlugin().init?.(realm)

    const ShortcutChild = realm.getValue(composerChildren$)[0] as React.ComponentType
    renderedTransformers.length = 0
    render(
      <RealmContext.Provider value={realm}>
        <ShortcutChild />
      </RealmContext.Provider>
    )
    const transformers = renderedTransformers[renderedTransformers.length - 1]

    expect(transformers).toContain(QUOTE)
    expect(findHeadingTransformer(transformers)).toBeDefined()
  })
})
