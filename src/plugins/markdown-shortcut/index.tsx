import { realmPlugin } from '../../RealmWithPlugins'
import {
  BOLD_ITALIC_STAR,
  BOLD_ITALIC_UNDERSCORE,
  BOLD_STAR,
  BOLD_UNDERSCORE,
  CHECK_LIST,
  CODE,
  ElementTransformer,
  INLINE_CODE,
  ITALIC_STAR,
  ITALIC_UNDERSCORE,
  LINK,
  ORDERED_LIST,
  QUOTE,
  TextFormatTransformer,
  TextMatchTransformer,
  UNORDERED_LIST
} from '@lexical/markdown'
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin.js'
import { $createHeadingNode, $isHeadingNode, HeadingNode, HeadingTagType } from '@lexical/rich-text'
import { ElementNode } from 'lexical'
import React from 'react'
import { $createCodeBlockNode, CodeBlockNode } from '../codeblock/CodeBlockNode'
import { activePlugins$, addComposerChild$, addNestedEditorChild$ } from '../core'
import { HEADING_LEVEL, allowedHeadingLevels$ } from '../headings'

/**
 * A plugin that adds markdown shortcuts to the editor.
 * @group Markdown Shortcuts
 */
export const markdownShortcutPlugin = realmPlugin({
  init(realm) {
    const pluginIds = realm.getValue(activePlugins$)
    const allowedHeadingLevels: ReadonlyArray<HEADING_LEVEL> = pluginIds.includes('headings') ? realm.getValue(allowedHeadingLevels$) : []
    const transformers = pickTransformersForActivePlugins(pluginIds, allowedHeadingLevels)
    realm.pubIn({
      [addComposerChild$]: () => <MarkdownShortcutPlugin transformers={transformers} />,
      [addNestedEditorChild$]: () => <MarkdownShortcutPlugin transformers={transformers} />
    })
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
    transformers.push(ORDERED_LIST, UNORDERED_LIST, CHECK_LIST)
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
