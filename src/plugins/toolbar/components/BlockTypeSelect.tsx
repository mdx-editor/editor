import { $createHeadingNode, $createQuoteNode } from '@lexical/rich-text'
import { useCellValue, usePublisher } from '@mdxeditor/gurx'
import { $createParagraphNode } from 'lexical'
import React from 'react'
import { BlockType, activePlugins$, convertSelectionToNode$, currentBlockType$ } from '../../core'
import { allowedHeadingLevels$ } from '../../headings'
import { Select } from '.././primitives/select'

/**
 * A toolbar component that allows the user to change the block type of the current selection.
 * Supports paragraphs, headings and block quotes.
 * @group Toolbar Components
 */
export const BlockTypeSelect = () => {
  const convertSelectionToNode = usePublisher(convertSelectionToNode$)
  const currentBlockType = useCellValue(currentBlockType$)
  const activePlugins = useCellValue(activePlugins$)
  const hasQuote = activePlugins.includes('quote')
  const hasHeadings = activePlugins.includes('headings')

  if (!hasQuote && !hasHeadings) {
    return null
  }
  const items: { label: string | JSX.Element; value: BlockType }[] = [{ label: 'Paragraph', value: 'paragraph' }]

  if (hasQuote) {
    items.push({ label: 'Quote', value: 'quote' })
  }

  if (hasHeadings) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const allowedHeadingLevels = useCellValue(allowedHeadingLevels$)
    items.push(...allowedHeadingLevels.map((n) => ({ label: `Heading ${n}`, value: `h${n}` }) as const))
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
