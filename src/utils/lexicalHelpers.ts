import {
  $createParagraphNode,
  $getRoot,
  $getSelection,
  $isRangeSelection,
  createEditor,
  ElementNode,
  LexicalEditor,
  RangeSelection,
  TextNode
} from 'lexical'
import { $generateJSONFromSelectedNodes, $generateNodesFromSerializedNodes } from '@lexical/clipboard'
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
 * The link dialog anchor is position: fixed, so coordinates must be relative to
 * the nearest fixed containing block (e.g. a transformed dialog) when one exists.
 */
function adjustedRectangle(rect: Pick<DOMRect, 'top' | 'left' | 'width' | 'height'>, rootElement: HTMLElement) {
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
}

/**
 * Gets the coordinates of the DOM element that renders the node with the given key.
 * @group Utils
 */
export function getNodeRectangle(editor: LexicalEditor, nodeKey: string) {
  const rootElement = editor.getRootElement()
  const element = editor.getElementByKey(nodeKey)
  if (rootElement === null || element === null) {
    return null
  }
  return adjustedRectangle(element.getBoundingClientRect(), rootElement)
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

    return adjustedRectangle(rect, rootElement)
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
 * Uses the same visitors and serialization options as the editor's full markdown export.
 * @group Utils
 */
export function getSelectionAsMarkdown(editor: LexicalEditor, exportParams: Omit<ExportMarkdownFromLexicalOptions, 'root'>): string {
  let temporaryEditor: LexicalEditor | null = null
  let selectedNodes: ReturnType<typeof $generateJSONFromSelectedNodes>['nodes'] = []
  let markdown = ''

  editor.getEditorState().read(
    () => {
      const selection = $getSelection()

      if (!selection || ($isRangeSelection(selection) && selection.isCollapsed()) || selection.getNodes().length === 0) {
        return
      }

      selectedNodes = $generateJSONFromSelectedNodes(editor, selection).nodes
      if (selectedNodes.length > 0) {
        // A no-config editor created in this context inherits the active editor's
        // complete registered node map, including consumer nodes and replacements.
        temporaryEditor = createEditor()
      }
    },
    { editor }
  )

  const selectedTreeEditor = temporaryEditor as LexicalEditor | null
  if (!selectedTreeEditor || selectedNodes.length === 0) {
    return ''
  }

  const exportResult: { error: unknown; failed: boolean } = { error: undefined, failed: false }

  selectedTreeEditor.update(
    () => {
      try {
        const root = $getRoot()
        const nodes = $generateNodesFromSerializedNodes(selectedNodes)
        let inlineContainer = $createParagraphNode()

        const appendInlineContainer = () => {
          if (!inlineContainer.isEmpty()) {
            root.append(inlineContainer)
            inlineContainer = $createParagraphNode()
          }
        }

        for (const node of nodes) {
          if (node.isInline()) {
            inlineContainer.append(node)
          } else {
            appendInlineContainer()
            root.append(node)
          }
        }
        appendInlineContainer()

        markdown = exportMarkdownFromLexical({ root, ...exportParams })
      } catch (error) {
        exportResult.failed = true
        exportResult.error = error
      }
    },
    { discrete: true, skipTransforms: true }
  )

  if (exportResult.failed) {
    throw exportResult.error
  }

  // Full-document export intentionally includes terminal line breaks. A
  // selection result is a fragment, so remove only those structural breaks.
  return markdown.replace(/\n+$/u, '')
}
