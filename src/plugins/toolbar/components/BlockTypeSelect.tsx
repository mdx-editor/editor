import { useI18n } from '@/plugins/core/i18n'
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
  const i18n = useI18n()

  if (!hasQuote && !hasHeadings) {
    return null
  }
  const items: { label: string | JSX.Element; value: BlockType }[] = [{ label: i18n.toolbar.blockTypes.paragraph, value: 'paragraph' }]

  if (hasQuote) {
    items.push({ label: i18n.toolbar.blockTypes.quote, value: 'quote' })
  }

  if (hasHeadings) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const allowedHeadingLevels = useCellValue(allowedHeadingLevels$)
    items.push(...allowedHeadingLevels.map((n) => ({ label: `${i18n.toolbar.blockTypes.heading} ${n}`, value: `h${n}` }) as const))
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
      triggerTitle={i18n.toolbar.blockTypeSelect.selectBlockTypeTooltip}
      placeholder={i18n.toolbar.blockTypeSelect.placeholder}
      items={items}
    />
  )
}
