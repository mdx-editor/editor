import { $setBlocksType_experimental } from '@lexical/selection'
import { BlockType } from './toolbar/BlockTypeSelect'
import { $createParagraphNode, $getSelection, $isRangeSelection, DEPRECATED_$isGridSelection, LexicalEditor } from 'lexical'
import { $createHeadingNode, $createQuoteNode, HeadingTagType } from '@lexical/rich-text'
import { $createCodeNode } from '@lexical/code'

export const formatParagraph = (editor: LexicalEditor) => {
  editor.update(() => {
    const selection = $getSelection()
    if ($isRangeSelection(selection) || DEPRECATED_$isGridSelection(selection))
      $setBlocksType_experimental(selection, () => $createParagraphNode())
  })
}

export const formatHeading = (editor: LexicalEditor, headingType: HeadingTagType) => {
  editor.update(() => {
    const selection = $getSelection()
    if ($isRangeSelection(selection) || DEPRECATED_$isGridSelection(selection)) {
      $setBlocksType_experimental(selection, () => $createHeadingNode(headingType))
    }
  })
}

export const formatQuote = (editor: LexicalEditor) => {
  editor.update(() => {
    const selection = $getSelection()
    if ($isRangeSelection(selection) || DEPRECATED_$isGridSelection(selection)) {
      $setBlocksType_experimental(selection, () => $createQuoteNode())
    }
  })
}

export const formatCode = (editor: LexicalEditor) => {
  editor.update(() => {
    let selection = $getSelection()

    if ($isRangeSelection(selection) || DEPRECATED_$isGridSelection(selection)) {
      if (selection.isCollapsed()) {
        $setBlocksType_experimental(selection, () => $createCodeNode())
      } else {
        const textContent = selection.getTextContent()
        const codeNode = $createCodeNode()
        selection.insertNodes([codeNode])
        selection = $getSelection()
        if ($isRangeSelection(selection)) {
          selection.insertRawText(textContent)
        }
      }
    }
  })
}
