import { $setBlocksType } from '@lexical/selection'
import { $createParagraphNode, $getSelection, $isRangeSelection, DEPRECATED_$isGridSelection, LexicalEditor } from 'lexical'
import { $createHeadingNode, $createQuoteNode, HeadingTagType } from '@lexical/rich-text'
import { $createCodeNode } from '@lexical/code'

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

export const formatCode = (editor: LexicalEditor) => {
  editor.update(() => {
    let selection = $getSelection()

    if ($isRangeSelection(selection) || DEPRECATED_$isGridSelection(selection)) {
      if (selection.isCollapsed()) {
        $setBlocksType(selection, () => $createCodeNode())
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
