import {
  $getRoot,
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  $isElementNode,
  ElementNode,
  LexicalEditor,
  LexicalNode,
  RangeSelection,
  TextNode
} from 'lexical'
import { $isLinkNode } from '@lexical/link'
import { $isHeadingNode } from '@lexical/rich-text'
import { $isListNode, $isListItemNode } from '@lexical/list'
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
  } catch {
    return null
  }
}

const WILL_CHANGE_CONTAINING_BLOCK_PROPS = ['transform', 'perspective', 'filter', 'backdrop-filter', 'contain', 'container-type']
const CONTAIN_VALUES_CREATING_CONTAINING_BLOCK = ['layout', 'paint', 'strict', 'content']

/**
 * Finds the nearest ancestor element that creates a containing block for fixed/absolute positioned elements.
 * @see https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_display/Containing_block
 */
function getFixedContainingBlock(element: HTMLElement | null): HTMLElement | null {
  let current = element?.parentElement
  while (current) {
    const style = window.getComputedStyle(current)

    const willChangeProps = style.willChange.split(',').map((v) => v.trim())
    const hasRelevantWillChange = willChangeProps.some((prop) => WILL_CHANGE_CONTAINING_BLOCK_PROPS.includes(prop))

    const createsContainingBlock =
      style.transform !== 'none' ||
      style.perspective !== 'none' ||
      style.filter !== 'none' ||
      style.backdropFilter !== 'none' ||
      CONTAIN_VALUES_CREATING_CONTAINING_BLOCK.includes(style.contain) ||
      style.containerType !== 'normal' ||
      style.contentVisibility === 'auto' ||
      hasRelevantWillChange

    if (createsContainingBlock) {
      return current
    }
    current = current.parentElement
  }
  return null
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

    const fixedContainer = getFixedContainingBlock(rootElement)
    if (fixedContainer) {
      const containerRect = fixedContainer.getBoundingClientRect()
      return {
        top: Math.round(rect.top - containerRect.top),
        left: Math.round(rect.left - containerRect.left),
        width: Math.round(rect.width),
        height: Math.round(rect.height)
      }
    }

    return {
      top: Math.round(rect.top),
      left: Math.round(rect.left),
      width: Math.round(rect.width),
      height: Math.round(rect.height)
    }
  } else if (activeElement?.className !== 'link-input') {
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

/**
 * Gets the markdown representation of the current selection in the Lexical editor.
 * Returns an empty string if there is no selection or if the selection is collapsed.
 * Converts selected nodes to markdown by recursively processing them and preserving formatting.
 * Note: Selects entire nodes, not partial selections within nodes.
 * @group Utils
 */
export function getSelectionAsMarkdown(editor: LexicalEditor, _exportParams: Omit<ExportMarkdownFromLexicalOptions, 'root'>): string {
  let markdown = ''

  editor.getEditorState().read(() => {
    const selection = $getSelection()

    // Return empty if no selection or collapsed
    if (!selection || !$isRangeSelection(selection) || selection.isCollapsed()) {
      return
    }

    // Get all nodes in the selection (entire nodes, not partial)
    const nodes = selection.getNodes()

    if (nodes.length === 0) {
      return
    }

    // Get unique block-level parent nodes to preserve structure (headings, lists, paragraphs, etc.)
    const parentNodes = new Set<ElementNode>()
    nodes.forEach((node) => {
      let current: LexicalNode | null = node

      // Walk up to find the nearest block-level parent (heading, paragraph, list item, etc.)
      while (current) {
        // Check if current node is a block-level node
        if ($isHeadingNode(current) || $isListItemNode(current) || current.getType() === 'paragraph' || current.getType() === 'quote') {
          if ($isElementNode(current)) {
            parentNodes.add(current)
          }
          break
        }

        current = current.getParent()
      }
    })

    // If we have parent nodes, use those instead of leaf nodes
    const nodesToProcess = parentNodes.size > 0 ? Array.from(parentNodes) : nodes

    // Helper function to recursively convert a node to markdown
    function nodeToMarkdown(node: LexicalNode): string {
      if ($isHeadingNode(node)) {
        // Handle heading nodes
        const level = parseInt(node.getTag().replace('h', ''))
        const children = node.getChildren()
        const headingText = children.map((child) => nodeToMarkdown(child)).join('')
        return '#'.repeat(level) + ' ' + headingText + '\n\n'
      } else if ($isListItemNode(node)) {
        // Handle list item nodes
        const parent = node.getParent()
        const prefix = parent && $isListNode(parent) && parent.getListType() === 'number' ? '1. ' : '- '
        const children = node.getChildren()
        const itemText = children.map((child) => nodeToMarkdown(child)).join('')
        return prefix + itemText + '\n'
      } else if ($isListNode(node)) {
        // Handle list nodes
        const children = node.getChildren()
        return children.map((child) => nodeToMarkdown(child)).join('') + '\n'
      } else if ($isTextNode(node)) {
        let text = node.getTextContent()
        const format = node.getFormat()

        // Apply markdown formatting based on Lexical text format flags
        // Bold: 1, Italic: 2, Strikethrough: 4, Underline: 8, Code: 16
        if (format & 16) {
          // Code
          return `\`${text}\``
        }
        // Apply formatting in correct order (innermost to outermost)
        if (format & 1) {
          // Bold
          text = `**${text}**`
        }
        if (format & 2) {
          // Italic
          text = `*${text}*`
        }
        if (format & 4) {
          // Strikethrough
          text = `~~${text}~~`
        }

        return text
      } else if ($isLinkNode(node)) {
        // Handle link nodes
        const url = node.getURL()
        const title = node.getTitle()
        const children = node.getChildren()
        const linkText = children.map((child) => nodeToMarkdown(child)).join('')

        if (title) {
          return `[${linkText}](${url} "${title}")`
        }
        return `[${linkText}](${url})`
      } else if ($isElementNode(node)) {
        // For other element nodes, process their children
        const children = node.getChildren()
        return children.map((child) => nodeToMarkdown(child)).join('')
      }

      // Fallback: return text content
      return node.getTextContent()
    }

    // Convert all selected nodes to markdown and concatenate
    markdown = nodesToProcess.map((node) => nodeToMarkdown(node)).join('')
  })

  return markdown.trim()
}
