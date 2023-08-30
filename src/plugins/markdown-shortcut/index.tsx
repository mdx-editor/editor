import {
  BOLD_ITALIC_STAR,
  BOLD_ITALIC_UNDERSCORE,
  BOLD_STAR,
  BOLD_UNDERSCORE,
  CODE,
  ElementTransformer,
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
import { HeadingNode, $isHeadingNode, HeadingTagType, $createHeadingNode } from '@lexical/rich-text'
import { ElementNode } from 'lexical'
import { HEADING_LEVEL } from '../headings'

/** @internal */
export const [markdownShortcutPlugin] = realmPlugin({
  id: 'markdown-shortcut',
  dependencies: [],
  systemSpec: system((_) => ({}), [coreSystem]),

  init: (realm, _, pluginIds) => {
    const allowedHeadingLevels: ReadonlyArray<HEADING_LEVEL> = pluginIds.includes('headings')
      ? // @ts-expect-error we query the realm for the allowed heading levels
        (realm.getKeyValue('allowedHeadingLevels') as ReadonlyArray<HEADING_LEVEL>)
      : []
    const transformers = pickTransformersForActivePlugins(pluginIds, allowedHeadingLevels)
    realm.pubKey('addComposerChild', () => <MarkdownShortcutPlugin transformers={transformers} />)
    realm.pubKey('addNestedEditorChild', () => <MarkdownShortcutPlugin transformers={transformers} />)
  }
})

const createBlockNode = (createNode: (match: Array<string>) => ElementNode): ElementTransformer['replace'] => {
  return (parentNode, children, match) => {
    const node = createNode(match)
    node.append(...children)
    parentNode.replace(node)
    node.select(0, 0)
  }
}

function pickTransformersForActivePlugins(pluginIds: string[], allowedHeadingLevels: ReadonlyArray<HEADING_LEVEL>) {
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
    // Using a range is technically a bug, because the developer might have allowed h2 and h4, but not h3.
    // However, it's a very unlikely edge case.
    const minHeadingLevel = Math.min(...allowedHeadingLevels)
    const maxHeadingLevel = Math.max(...allowedHeadingLevels)
    const headingRegExp = new RegExp(`^(#{${minHeadingLevel},${maxHeadingLevel}})\\s`)

    const HEADING: ElementTransformer = {
      dependencies: [HeadingNode],
      export: (node, exportChildren) => {
        if (!$isHeadingNode(node)) {
          return null
        }
        const level = Number(node.getTag().slice(1))
        return '#'.repeat(level) + ' ' + exportChildren(node)
      },
      regExp: headingRegExp,
      replace: createBlockNode((match) => {
        const tag = `h${match[1].length}` as HeadingTagType
        return $createHeadingNode(tag)
      }),
      type: 'element'
    }
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
