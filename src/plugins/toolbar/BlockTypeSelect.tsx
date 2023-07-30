import { $createHeadingNode, $createQuoteNode, HeadingTagType } from '@lexical/rich-text'
import { $createParagraphNode } from 'lexical'
import React from 'react'
import { BlockType, corePluginHooks } from '../core/realmPlugin'
import { Select } from './primitives/select'

export const BlockTypeSelect = () => {
  const convertSelectionToNode = corePluginHooks.usePublisher('convertSelectionToNode')
  const [currentBlockType] = corePluginHooks.useEmitterValues('currentBlockType')
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
      items={[
        { label: 'Paragraph', value: 'paragraph' },
        { label: 'Quote', value: 'quote' },
        ...([1, 2, 3, 4, 5, 6] as const).map((n) => ({ label: `Heading ${n}`, value: `h${n}` } as const))
      ]}
    />
  )
}
