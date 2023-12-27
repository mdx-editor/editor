import { $getRoot, $getSelection, ElementNode, LexicalEditor, RangeSelection, TextNode } from 'lexical'
import { $isAtNodeEnd } from '@lexical/selection'
import { tap } from './fp'
import { ExportMarkdownFromLexicalOptions, exportMarkdownFromLexical } from '../exportMarkdownFromLexical'

/**
 * Fetches a value from the Lexical editor read cycle.
 * @group Utils
 */
export function fromWithinEditorRead<T>(editor: LexicalEditor, fn: () => T): T {
  let result: T | null = null
  editor.getEditorState().read(() => {
    result = fn()
  })
  return result as T
}

/**
 * Gets the selected node from the Lexical editor.
 * @group Utils
 */
export function getSelectedNode(selection: RangeSelection): TextNode | ElementNode | null {
  try {
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
  } catch (e) {
    return null
  }
}

/**
 * Gets the coordinates of the selection in the Lexical editor.
 * @group Utils
 */
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

    if (nativeSelection.isCollapsed) {
      let node = nativeSelection.anchorNode
      if (node?.nodeType == 3) {
        node = node.parentNode
      }
      rect = (node as HTMLElement).getBoundingClientRect()
      rect.width = 0
    } else {
      if (nativeSelection.anchorNode === rootElement) {
        let inner = rootElement
        while (inner.firstElementChild != null) {
          inner = inner.firstElementChild as HTMLElement
        }
        rect = inner.getBoundingClientRect()
      } else {
        rect = domRange.getBoundingClientRect()
      }
    }
    return {
      top: Math.round(rect.top),
      left: Math.round(rect.left),
      width: Math.round(rect.width),
      height: Math.round(rect.height)
    }
  } else if (!activeElement || activeElement.className !== 'link-input') {
    return null
  }
  return null
}

/** @internal */
export function getStateAsMarkdown(editor: LexicalEditor, exportParams: Omit<ExportMarkdownFromLexicalOptions, 'root'>) {
  return tap({ markdown: '' }, (result) => {
    editor.getEditorState().read(() => {
      result.markdown = exportMarkdownFromLexical({ root: $getRoot(), ...exportParams })
    })
  }).markdown
}
