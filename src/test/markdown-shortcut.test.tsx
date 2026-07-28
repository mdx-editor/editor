import React from 'react'
import { describe, expect, it } from 'vitest'
import type { ElementTransformer, Transformer } from '@lexical/markdown'
import { HeadingNode } from '@lexical/rich-text'
import { Realm } from '@mdxeditor/gurx'
import { composerChildren$ } from '../plugins/core'
import { headingsPlugin, type HEADING_LEVEL } from '../plugins/headings'
import { markdownShortcutPlugin } from '../plugins/markdown-shortcut'

function headingShortcutRegExp(allowedHeadingLevels: readonly HEADING_LEVEL[]) {
  const realm = new Realm()

  headingsPlugin({ allowedHeadingLevels }).init?.(realm)
  markdownShortcutPlugin().init?.(realm)

  const ShortcutChild = realm.getValue(composerChildren$)[0] as () => React.ReactElement<{ transformers: Transformer[] }>
  const shortcutElement = ShortcutChild()
  const headingTransformer = shortcutElement.props.transformers.find((transformer): transformer is ElementTransformer => {
    return (
      'regExp' in transformer &&
      'dependencies' in transformer &&
      transformer.dependencies.includes(HeadingNode) &&
      transformer.type === 'element'
    )
  })

  expect(headingTransformer).toBeDefined()
  return headingTransformer!.regExp
}

describe('markdownShortcutPlugin', () => {
  it('uses configured heading levels during plugin initialization', () => {
    const regExp = headingShortcutRegExp([1, 2])

    expect('# ').toMatch(regExp)
    expect('## ').toMatch(regExp)
    expect('### ').not.toMatch(regExp)
  })
})
