import { $setBlocksType } from '@lexical/selection'
import { $createParagraphNode, $getSelection, $isRangeSelection, DEPRECATED_$isGridSelection, LexicalEditor } from 'lexical'
import { $createHeadingNode, $createQuoteNode, HeadingTagType } from '@lexical/rich-text'
import { $createAdmonitionNode, AdmonitionKind } from '../../../nodes'

export const formatParagraph = (editor: LexicalEditor) => {
  editor.update(() => {
    const selection = $getSelection()
    if ($isRangeSelection(selection) || DEPRECATED_$isGridSelection(selection)) $setBlocksType(selection, () => $createParagraphNode())
  })
}

export const formatHeading = (editor: LexicalEditor, headingType: HeadingTagType) => {
  editor.update(() => {
    const selection = $getSelection()
    if ($isRangeSelection(selection) || DEPRECATED_$isGridSelection(selection)) {
      $setBlocksType(selection, () => $createHeadingNode(headingType))
    }
  })
}

export const formatQuote = (editor: LexicalEditor) => {
  editor.update(() => {
    const selection = $getSelection()
    if ($isRangeSelection(selection) || DEPRECATED_$isGridSelection(selection)) {
      $setBlocksType(selection, () => $createQuoteNode())
    }
  })
}

export const formatAdmonition = (editor: LexicalEditor, kind: AdmonitionKind) => {
  editor.update(() => {
    const selection = $getSelection()
    if ($isRangeSelection(selection) || DEPRECATED_$isGridSelection(selection)) {
      $setBlocksType(selection, () => {
        return $createAdmonitionNode(kind)
      })
    }
  })
}
