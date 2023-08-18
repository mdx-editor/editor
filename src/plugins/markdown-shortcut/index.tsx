import {
  BOLD_ITALIC_STAR,
  BOLD_ITALIC_UNDERSCORE,
  BOLD_STAR,
  BOLD_UNDERSCORE,
  CODE,
  ElementTransformer,
  HEADING,
  INLINE_CODE,
  ITALIC_STAR,
  ITALIC_UNDERSCORE,
  LINK,
  ORDERED_LIST,
  QUOTE,
  TextFormatTransformer,
  UNORDERED_LIST
} from '@lexical/markdown'
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin.js'
import React from 'react'
import { realmPlugin, system } from '../../gurx'
import { $createCodeBlockNode, CodeBlockNode } from '../codeblock/CodeBlockNode'
import { coreSystem } from '../core'
import { TextMatchTransformer } from '@lexical/markdown'

/** @internal */
export const [markdownShortcutPlugin] = realmPlugin({
  id: 'markdown-shortcut',
  dependencies: [],
  systemSpec: system((_) => ({}), [coreSystem]),

  init: (realm, _, pluginIds) => {
    const transformers = pickTransformersForActivePlugins(pluginIds)
    realm.pubKey('addComposerChild', () => <MarkdownShortcutPlugin transformers={transformers} />)
    realm.pubKey('addNestedEditorChild', () => <MarkdownShortcutPlugin transformers={transformers} />)
  }
})

function pickTransformersForActivePlugins(pluginIds: string[]) {
  const transformers: (ElementTransformer | TextFormatTransformer | TextMatchTransformer)[] = [
    BOLD_ITALIC_STAR,
    BOLD_ITALIC_UNDERSCORE,
    BOLD_STAR,
    BOLD_UNDERSCORE,
    INLINE_CODE,
    ITALIC_STAR,
    ITALIC_UNDERSCORE
    // HIGHLIGHT,
    // STRIKETHROUGH
  ]

  if (pluginIds.includes('headings')) {
    transformers.push(HEADING)
  }

  if (pluginIds.includes('quote')) {
    transformers.push(QUOTE)
  }

  if (pluginIds.includes('link')) {
    transformers.push(LINK)
  }
  if (pluginIds.includes('lists')) {
    transformers.push(ORDERED_LIST, UNORDERED_LIST)
  }

  if (pluginIds.includes('codeblock')) {
    const codeTransformerCopy: ElementTransformer = {
      ...CODE,
      dependencies: [CodeBlockNode],
      replace: (parentNode, _children, match) => {
        const codeBlockNode = $createCodeBlockNode({ code: '', language: match ? match[1] : '', meta: '' })
        parentNode.replace(codeBlockNode)
        setTimeout(() => codeBlockNode.select(), 80)
      }
    }
    transformers.push(codeTransformerCopy)
  }

  return transformers
}
