/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import { Cell, debounceTime, useCell, useCellValue, useRealm } from '@mdxeditor/gurx'
import { $createRangeSelection, $getNearestNodeFromDOMNode, $isTextNode, getNearestEditorFromDOMNode } from 'lexical'
import { realmPlugin } from '../../RealmWithPlugins'
import { contentEditableRef$, createRootEditorSubscription$ } from '../core'

export const EmptyTextNodeIndex: TextNodeIndex = {
  allText: '',
  nodeIndex: [],
  offsetIndex: []
}
export const editorSearchTerm$ = Cell<string>('')
export const editorSearchRanges$ = Cell<Range[]>([])
export const editorSearchCursor$ = Cell<number>(0)
export const editorSearchTextNodeIndex$ = Cell<TextNodeIndex>(EmptyTextNodeIndex)

export const searchOpen$ = Cell<boolean>(false)
export const editorSearchTermDebounced$ = Cell<string>('', (realm) => {
  realm.link(editorSearchTermDebounced$, realm.pipe(editorSearchTerm$, realm.transformer(debounceTime(250))))
})
export const editorSearchScrollableContent$ = Cell<HTMLElement | null>(null, (r) =>
  r.sub(contentEditableRef$, (cref) => {
    r.pub(editorSearchScrollableContent$, cref?.current?.parentNode ?? null)
  })
)

export const MDX_SEARCH_NAME = 'MdxSearch'
export const MDX_FOCUS_SEARCH_NAME = 'MdxFocusSearch'

export interface TextNodeIndex {
  allText: string
  nodeIndex: Node[]
  offsetIndex: number[]
}

export const debouncedIndexer$ = Cell<TextNodeIndex>(EmptyTextNodeIndex, (realm) => {
  realm.link(debouncedIndexer$, realm.pipe(editorSearchTextNodeIndex$, realm.transformer(debounceTime(250))))
})

function* searchText(allText: string, searchQuery: string): Generator<[start: number, end: number]> {
  if (!searchQuery) {
    return
  }

  let regex: RegExp
  try {
    regex = new RegExp(searchQuery, 'gi')
  } catch (e) {
    console.error('Invalid search pattern:', e)
    return
  }

  let match
  while ((match = regex.exec(allText)) !== null) {
    if (match[0].length === 0) {
      if (regex.lastIndex === match.index) {
        regex.lastIndex++
      }
      continue
    }

    const start = match.index
    const end = start + match[0].length - 1
    yield [start, end]
  }
}

/**
 * Creates a single, unified index of all text nodes within valid content containers.
 * This allows matches to span across different block-level elements.
 */
function indexAllTextNodes(root: HTMLElement | null): TextNodeIndex {
  let allText = ''
  const nodeIndex: Node[] = []
  const offsetIndex: number[] = []

  if (!root) {
    return { allText: '', nodeIndex, offsetIndex }
  }

  // A CSS selector for all valid content-hosting elements.
  const contentSelector = 'p, h1, h2, h3, h4, h5, h6, li, code, pre'

  const treeWalker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT,
    // The corrected heuristic: accept any text node that is a descendant of a valid content container.
    (node) => {
      // Use `closest()` on the parent to see if it's inside a valid container.
      if (node.parentElement?.closest(contentSelector)) {
        return NodeFilter.FILTER_ACCEPT
      }
      return NodeFilter.FILTER_REJECT
    }
  )

  let currentNode: Node | null
  while ((currentNode = treeWalker.nextNode())) {
    const nodeContent = currentNode.textContent?.normalize('NFKD') ?? currentNode.textContent ?? ''
    for (let i = 0; i < nodeContent.length; i++) {
      nodeIndex.push(currentNode)
      offsetIndex.push(i)
      allText += nodeContent[i] ?? ''
    }
  }

  return { allText, nodeIndex, offsetIndex }
}

export function* rangeSearchScan(searchQuery: string, { allText, offsetIndex, nodeIndex }: TextNodeIndex) {
  for (const [start, end] of searchText(allText, searchQuery)) {
    const startOffset = offsetIndex[start]
    const endOffset = offsetIndex[end]
    const startNode = nodeIndex[start]
    const endNode = nodeIndex[end]
    const range = new Range()

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (startNode === undefined || endNode === undefined || startOffset === undefined || endOffset === undefined) {
      throw new Error('Invalid range: startNode, endNode, startOffset, or endOffset is undefined.')
    }

    range.setStart(startNode, startOffset)
    range.setEnd(endNode, endOffset + 1)
    yield range
  }
}
const focusHighlightRange = (range?: Range | null) => {
  CSS.highlights.delete(MDX_FOCUS_SEARCH_NAME)
  if (range) CSS.highlights.set(MDX_FOCUS_SEARCH_NAME, new Highlight(range))
}

const highlightRanges = (ranges: Range[] | Iterable<Range>) => {
  CSS.highlights.set(MDX_SEARCH_NAME, new Highlight(...ranges))
}

const resetHighlights = () => {
  CSS.highlights.delete(MDX_SEARCH_NAME)
  CSS.highlights.delete(MDX_FOCUS_SEARCH_NAME)
}
const scrollToRange = (
  range: Range,
  contentEditable: HTMLElement | undefined,
  options?: {
    scrollElement?: HTMLElement
    ignoreIfInView?: boolean
    behavior?: ScrollBehavior
  }
) => {
  // Set defaults if options or any property is undefined
  const ignoreIfInView = options?.ignoreIfInView ?? true
  const behavior = options?.behavior ?? 'smooth'

  const [first] = range.getClientRects()

  if (!contentEditable) {
    console.warn('No content-editable element found for scrolling.')
    return
  }
  if (!first) {
    console.warn('No client rect found for the range, cannot scroll.')
    return
  }

  // Get bounding rects relative to the scroll container
  const containerRect = contentEditable.getBoundingClientRect()
  const topRelativeToContainer = first.top - containerRect.top
  const bottomRelativeToContainer = first.bottom - containerRect.top
  // Optionally ignore if already in view
  if (ignoreIfInView) {
    // The visible area is [scrollTop, scrollTop + clientHeight]
    // The range is in view if its top and bottom are within this area
    const rangeTop = topRelativeToContainer + contentEditable.scrollTop
    const rangeBottom = bottomRelativeToContainer + contentEditable.scrollTop
    const visibleTop = contentEditable.scrollTop
    const visibleBottom = visibleTop + contentEditable.clientHeight

    const inView = rangeTop >= visibleTop && rangeBottom <= visibleBottom

    if (inView) return
  }

  // Scroll so the range is near the top, with some offset if desired
  const top = topRelativeToContainer + contentEditable.scrollTop - first.height // adjust this offset as needed

  contentEditable.scrollTo({ top, behavior })
}

function isSimilarRange(range1: Pick<Range, 'startContainer' | 'startOffset'>, range2: Pick<Range, 'startContainer' | 'startOffset'>) {
  return range1.startContainer === range2.startContainer && range1.startOffset === range2.startOffset
}

function replaceTextInRange(range: Range, str: string, onUpdate?: () => void) {
  const startDomNode = range.startContainer
  const endDomNode = range.endContainer
  const startOffset = range.startOffset
  const endOffset = range.endOffset

  const editor = getNearestEditorFromDOMNode(startDomNode)
  if (!editor) {
    console.warn('No editor found for the provided DOM node.')
    return
  }
  editor.update(
    () => {
      // 1. Find the Lexical nodes corresponding to the DOM nodes in your range.
      const startLexicalNode = $getNearestNodeFromDOMNode(startDomNode)
      const endLexicalNode = $getNearestNodeFromDOMNode(endDomNode)

      // 2. Safety check: Ensure they are valid TextNodes.
      if (!$isTextNode(startLexicalNode) || !$isTextNode(endLexicalNode)) {
        return
      }

      // 3. Create a Lexical RangeSelection that mirrors your DOM Range.
      try {
        const selection = $createRangeSelection()
        selection.anchor.set(startLexicalNode.getKey(), startOffset, 'text')
        selection.focus.set(endLexicalNode.getKey(), endOffset, 'text')

        // 4. Perform the replacement. This deletes the selected content
        // and inserts the new string.
        selection.insertText(str)
      } catch (e) {
        console.warn('Error replacing text in the editor:', e)
        if (onUpdate) {
          onUpdate()
        }
        // Optionally, you can throw an error or handle it gracefully.
        // throw new Error("Failed to replace text in the editor");
      }
    },
    {
      onUpdate
    }
  )
}

export function useEditorSearch() {
  const realm = useRealm()
  const ranges = useCellValue(editorSearchRanges$)
  const cursor = useCellValue(editorSearchCursor$)
  const search = useCellValue(editorSearchTerm$)
  const currentRange = ranges[cursor - 1] ?? null
  const contentEditable = useCellValue(editorSearchScrollableContent$)
  const [isSearchOpen, setIsSearchOpen] = useCell(searchOpen$)

  const openSearch = () => {
    setIsSearchOpen(true)
  }
  const closeSearch = () => {
    setIsSearchOpen(false)
  }
  const toggleSearch = () => {
    setIsSearchOpen(!isSearchOpen)
  }

  const rangeCount = ranges.length
  const scrollToRangeOrIndex = (range: Range | number, options?: { ignoreIfInView?: boolean; behavior?: ScrollBehavior }) => {
    const scrollRange = typeof range === 'number' ? ranges[range - 1] : range
    if (!scrollRange) {
      throw new Error('Error scrolling to range, range does not exist')
    }
    scrollToRange(scrollRange, contentEditable!, options)
  }

  const setSearch = (term: string | null) => {
    if ((term ?? '') !== search) {
      realm.pub(editorSearchCursor$, 0)
    }
    realm.pub(editorSearchTermDebounced$, term ?? '')
    //reset cursor
  }

  const next = () => {
    if (!ranges.length) return
    const newVal = (cursor % ranges.length) + 1
    scrollToRangeOrIndex(newVal)
    realm.pub(editorSearchCursor$, newVal)
  }

  const prev = () => {
    if (!ranges.length) return
    const newVal = cursor <= 1 ? ranges.length : cursor - 1
    scrollToRangeOrIndex(newVal)
    realm.pub(editorSearchCursor$, newVal)
  }

  const replace = (str: string, onUpdate?: () => void) => {
    const currentRange = ranges[cursor - 1]
    if (!currentRange) {
      return
    }
    const { startContainer, startOffset } = currentRange ?? {}
    replaceTextInRange(currentRange, str, () => {
      //when the replaced text continues to match the search term
      //cursor must be incremented to the next match
      const unsub = realm.sub(editorSearchRanges$, (newRanges) => {
        unsub()
        if (
          isSimilarRange(newRanges[cursor - 1] ?? {}, {
            startOffset,
            startContainer
          })
        ) {
          realm.pub(editorSearchCursor$, (cursor + 1) % (newRanges.length + 1) || 1)
        }
      })
      onUpdate?.()
    })
  }

  const replaceAll = (str: string, onUpdate?: () => void) => {
    const runReplaceAll = () => {
      let ticks = 0
      for (let i = ranges.length - 1; i >= 0; i--) {
        const textReplaceRange = ranges[i]
        if (!textReplaceRange) {
          throw new Error('error replacing all text range does not exist')
        }
        replaceTextInRange(textReplaceRange, str, () => {
          ticks++
          if (ticks >= ranges.length) {
            onUpdate?.()
          }
        })
      }
    }
    if (typeof requestIdleCallback === 'function') {
      requestIdleCallback(runReplaceAll)
    } else {
      setTimeout(runReplaceAll, 0)
    }
  }

  return {
    next,
    prev,
    total: rangeCount,
    cursor,
    setSearch,
    search,
    currentRange,
    isSearchOpen,
    setIsSearchOpen,
    openSearch,
    closeSearch,
    toggleSearch,
    ranges,
    scrollToRangeOrIndex,
    replace,
    replaceAll
  }
}

export const searchPlugin = realmPlugin({
  //TODO: ensure proper event cleanup
  init(realm) {
    if (typeof CSS.highlights === 'undefined') {
      console.warn('CSS.highlights is not supported in this browser. Search functionality will be limited.')
      return
    }
    realm.sub(editorSearchCursor$, (cursor) => {
      const ranges = realm.getValue(editorSearchRanges$)
      focusHighlightRange(ranges[cursor - 1])
    })

    const updateHighlights = (searchQuery: string, textNodeIndex: TextNodeIndex) => {
      if (!searchQuery) {
        realm.pub(editorSearchCursor$, 0)
        realm.pub(editorSearchRanges$, [])
        resetHighlights()
        return
      }
      const ranges = Array.from(rangeSearchScan(searchQuery, textNodeIndex))
      realm.pub(editorSearchRanges$, ranges)
      highlightRanges(ranges)
      if (ranges.length) {
        const currentCursor = realm.getValue(editorSearchCursor$) || 1
        focusHighlightRange(ranges[currentCursor - 1])
        realm.pub(editorSearchCursor$, currentCursor)
        const scrollRange = ranges[currentCursor - 1]
        if (!scrollRange) throw new Error('error updating highlights, scroll range does not exist')
        const contentEditable = realm.getValue(editorSearchScrollableContent$)
        scrollToRange(scrollRange, contentEditable!, {
          ignoreIfInView: true
        })
      } else {
        resetHighlights()
      }
    }

    realm.sub(editorSearchTextNodeIndex$, (textNodeIndex) => {
      updateHighlights(realm.getValue(editorSearchTerm$), textNodeIndex)
    })

    realm.sub(editorSearchTerm$, (searchQuery) => {
      updateHighlights(searchQuery, realm.getValue(editorSearchTextNodeIndex$))
    })

    realm.pub(createRootEditorSubscription$, (editor) => {
      let observer: MutationObserver | null = null
      return editor.registerRootListener((rootElement) => {
        if (observer) {
          observer.disconnect()
          observer = null
        }
        if (rootElement) {
          //why is this in an array?
          const initialIndex = indexAllTextNodes(rootElement)
          realm.pub(editorSearchTextNodeIndex$, initialIndex)

          observer = new MutationObserver(() => {
            const newIndex = indexAllTextNodes(rootElement)
            if (realm.getValue(searchOpen$)) {
              realm.pub(editorSearchTextNodeIndex$, newIndex)
            } else {
              //TODO: indexing on every update may be too heavy handed,
              // an index should only happen when search is made active IF the
              // the search closeOn on blur is set to true
              realm.pub(debouncedIndexer$, newIndex)
            }
          })
          observer.observe(rootElement, {
            childList: true,
            subtree: true,
            characterData: true
          })
          return () => observer?.disconnect()
        }
      })
    })
  }
})
