import { $isHeadingNode } from '@lexical/rich-text'
import { Cell, Signal } from '@mdxeditor/gurx'
import { $getRoot, LexicalEditor } from 'lexical'
import { realmPlugin } from '../../RealmWithPlugins'
import { addActivePlugin$, addComposerChild$, createRootEditorSubscription$, rootEditor$ } from '../core'
import { CollapsibleSectionsComponent } from './CollapsibleSectionsComponent'

function headingTagToLevel(tag: string): number {
  return parseInt(tag.replace('h', ''), 10)
}

interface HeadingInfo {
  key: string
  level: number
  element: HTMLElement | null
}

/**
 * Collects heading information and their DOM elements from the Lexical tree.
 * Only considers top-level headings (direct children of root).
 */
function collectHeadingsWithElements(editor: LexicalEditor): HeadingInfo[] {
  const headings: HeadingInfo[] = []
  editor.getEditorState().read(() => {
    const root = $getRoot()
    root.getChildren().forEach((child) => {
      if ($isHeadingNode(child)) {
        headings.push({
          key: child.getKey(),
          level: headingTagToLevel(child.getTag()),
          element: editor.getElementByKey(child.getKey())
        })
      }
    })
  })
  return headings
}

/**
 * Removes all collapsible section attributes from the DOM.
 */
function clearCollapseAttributes(rootElement: HTMLElement) {
  rootElement.querySelectorAll('[data-collapsed-by]').forEach((el) => {
    el.removeAttribute('data-collapsed-by')
  })

  rootElement.querySelectorAll('[data-collapsible-heading]').forEach((el) => {
    el.removeAttribute('data-collapsible-heading')
    el.removeAttribute('data-heading-collapsed')
    el.removeAttribute('data-heading-key')
  })
}

/**
 * Updates the DOM to reflect the current collapse state.
 * Headings are processed outermost-first so that outer collapses take precedence
 * over inner ones. An inner collapse never overwrites an outer collapse's attribute.
 */
function updateCollapseUI(editor: LexicalEditor, collapsedKeys: Set<string>) {
  const rootElement = editor.getRootElement()
  if (!rootElement) {
    return
  }

  requestAnimationFrame(() => {
    clearCollapseAttributes(rootElement)

    const headings = collectHeadingsWithElements(editor)

    for (let i = 0; i < headings.length; i++) {
      const heading = headings[i]
      if (!heading.element) {
        continue
      }

      heading.element.setAttribute('data-collapsible-heading', 'true')
      heading.element.setAttribute('data-heading-key', heading.key)

      const isCollapsed = collapsedKeys.has(heading.key)
      if (isCollapsed) {
        heading.element.setAttribute('data-heading-collapsed', 'true')

        // Find the boundary: the next heading of same or higher level, or end of document
        let boundaryElement: Element | null = null
        for (let j = i + 1; j < headings.length; j++) {
          if (headings[j].level <= heading.level) {
            boundaryElement = headings[j].element
            break
          }
        }

        // Hide all DOM siblings between this heading and the boundary.
        // Don't overwrite attributes set by an outer (earlier) collapse —
        // outermost collapsed heading wins, which is correct since we iterate
        // in document order (outer headings come first).
        let el: Element | null = heading.element.nextElementSibling
        while (el && el !== boundaryElement) {
          if (!el.hasAttribute('data-collapsed-by')) {
            el.setAttribute('data-collapsed-by', heading.key)
          }
          el = el.nextElementSibling
        }
      }
    }
  })
}

/**
 * Holds the set of currently collapsed heading node keys.
 * @group Collapsible Sections
 */
export const collapsedHeadingKeys$ = Cell<Set<string>>(new Set())

/**
 * A signal to toggle a specific heading's collapse state.
 * Publish a heading node key to toggle it.
 * @group Collapsible Sections
 */
export const toggleHeadingCollapse$ = Signal<string>((r) => {
  r.sub(toggleHeadingCollapse$, (nodeKey) => {
    const collapsedKeys = new Set(r.getValue(collapsedHeadingKeys$))
    if (collapsedKeys.has(nodeKey)) {
      collapsedKeys.delete(nodeKey)
    } else {
      collapsedKeys.add(nodeKey)
    }
    const rootEditor = r.getValue(rootEditor$)
    if (rootEditor) {
      r.pub(collapsedHeadingKeys$, collapsedKeys)
      updateCollapseUI(rootEditor, collapsedKeys)
    }
  })
})

/**
 * A signal to collapse or expand all sections.
 * Publish `true` to collapse all, `false` to expand all.
 * @group Collapsible Sections
 */
export const toggleAllSections$ = Signal<boolean>((r) => {
  r.sub(toggleAllSections$, (collapse) => {
    const rootEditor = r.getValue(rootEditor$)
    if (!rootEditor) {
      return
    }

    if (collapse) {
      const allKeys = collectHeadingsWithElements(rootEditor).map((h) => h.key)
      r.pub(collapsedHeadingKeys$, new Set(allKeys))
      updateCollapseUI(rootEditor, new Set(allKeys))
    } else {
      r.pub(collapsedHeadingKeys$, new Set())
      updateCollapseUI(rootEditor, new Set())
    }
  })
})

/**
 * A plugin that adds support for collapsing/expanding document sections by heading level.
 * Click on the left side of a heading to toggle collapse. All content under the heading
 * (until the next heading of same or higher level) will be hidden.
 *
 * This is a UI-only feature. Collapse state is transient and not persisted to markdown.
 *
 * @group Collapsible Sections
 */
export const collapsibleSectionsPlugin = realmPlugin({
  init(realm) {
    realm.pubIn({
      [addActivePlugin$]: 'collapsibleSections'
    })

    realm.pub(addComposerChild$, CollapsibleSectionsComponent)

    // Update collapse UI when the document structure changes.
    // Always run to keep heading attributes in sync, even when nothing is collapsed.
    realm.pub(createRootEditorSubscription$, (editor) => {
      // Initial setup: apply heading attributes once the root element is ready
      let initialUpdateDone = false
      const removeRootListener = editor.registerRootListener((rootElement) => {
        if (rootElement && !initialUpdateDone) {
          initialUpdateDone = true
          updateCollapseUI(editor, realm.getValue(collapsedHeadingKeys$))
        }
      })

      const removeUpdateListener = editor.registerUpdateListener(({ dirtyElements }) => {
        if (dirtyElements.size === 0) {
          return
        }
        updateCollapseUI(editor, realm.getValue(collapsedHeadingKeys$))
      })

      return () => {
        removeRootListener()
        removeUpdateListener()
      }
    })
  }
})
