import { $createHeadingNode, $createQuoteNode } from '@lexical/rich-text'
import { $createParagraphNode } from 'lexical'
import React from 'react'
import { useHasPlugin } from '../../../gurx'
import { BlockType, corePluginHooks } from '../../core'
import { Select } from '.././primitives/select'

export const BlockTypeSelect = () => {
  const convertSelectionToNode = corePluginHooks.usePublisher('convertSelectionToNode')
  const [currentBlockType] = corePluginHooks.useEmitterValues('currentBlockType')
  const hasQuote = useHasPlugin('quote')
  const hasHeadings = useHasPlugin('headings')

  if (!hasQuote && !hasHeadings) {
    return null
  }
  const items: { label: string; value: BlockType }[] = [{ label: 'Paragraph', value: 'paragraph' }]

  if (hasQuote) {
    items.push({ label: 'Quote', value: 'quote' })
  }

  if (hasHeadings) {
    items.push(...([1, 2, 3, 4, 5, 6] as const).map((n) => ({ label: `Heading ${n}`, value: `h${n}` } as const)))
  }

  return (
    <Select<BlockType>
      value={currentBlockType}
      onChange={(blockType) => {
        switch (blockType) {
          case 'quote':
            convertSelectionToNode(() => $createQuoteNode())
            break
          case 'paragraph':
            convertSelectionToNode(() => $createParagraphNode())
            break
          default:
            if (blockType == '') {
            } else if (blockType.startsWith('h')) {
              convertSelectionToNode(() => $createHeadingNode(blockType))
            } else {
              throw new Error(`Unknown block type: ${blockType}`)
            }
        }
      }}
      triggerTitle="Select block type"
      placeholder="Block type"
      items={items}
    />
  )
}
