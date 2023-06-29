import { $getRoot, $getSelection, ElementNode, LexicalEditor, RangeSelection, TextNode } from 'lexical'
import { $isAtNodeEnd } from '@lexical/selection'
import { tap } from './fp'
import { ExportMarkdownFromLexicalOptions, exportMarkdownFromLexical } from '../export'

export function fromWithinEditorRead<T>(editor: LexicalEditor, fn: () => T): T {
  let result: T | null = null
  editor.getEditorState().read(() => {
    result = fn()
  })
  return result as T
}
export function getSelectedNode(selection: RangeSelection): TextNode | ElementNode {
  const anchor = selection.anchor
  const focus = selection.focus
  const anchorNode = selection.anchor.getNode()
  const focusNode = selection.focus.getNode()
  if (anchorNode === focusNode) {
    return anchorNode
  }
  const isBackward = selection.isBackward()
  if (isBackward) {
    return $isAtNodeEnd(focus) ? anchorNode : focusNode
  } else {
    return $isAtNodeEnd(anchor) ? anchorNode : focusNode
  }
}

export function getSelectionRectangle(editor: LexicalEditor) {
  const selection = $getSelection()
  const nativeSelection = window.getSelection()
  const activeElement = document.activeElement

  const rootElement = editor.getRootElement()

  if (
    selection !== null &&
    nativeSelection !== null &&
    rootElement !== null &&
    rootElement.contains(nativeSelection.anchorNode) &&
    editor.isEditable()
  ) {
    const domRange = nativeSelection.getRangeAt(0)
    let rect
    if (nativeSelection.anchorNode === rootElement) {
      let inner = rootElement
      while (inner.firstElementChild != null) {
        inner = inner.firstElementChild as HTMLElement
      }
      rect = inner.getBoundingClientRect()
    } else {
      rect = domRange.getBoundingClientRect()
    }

    return {
      top: rect.top + window.scrollY,
      left: rect.left + window.scrollX,
      width: rect.width,
      height: rect.height
    }
  } else if (!activeElement || activeElement.className !== 'link-input') {
    return null
  }
  return null
}

export function getStateAsMarkdown(editor: LexicalEditor, exportParams: Omit<ExportMarkdownFromLexicalOptions, 'root'>) {
  return tap({ markdown: '' }, (result) => {
    editor.getEditorState().read(() => {
      result.markdown = exportMarkdownFromLexical({ root: $getRoot(), ...exportParams })
    })
  }).markdown
}
