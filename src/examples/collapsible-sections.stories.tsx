import React from 'react'
import { usePublisher } from '@mdxeditor/gurx'
import {
  MDXEditor,
  collapsibleSectionsPlugin,
  headingsPlugin,
  listsPlugin,
  quotePlugin,
  linkPlugin,
  thematicBreakPlugin,
  toolbarPlugin,
  diffSourcePlugin,
  markdownShortcutPlugin,
  toggleAllSections$,
  addTopAreaChild$,
  UndoRedo,
  DiffSourceToggleWrapper,
  realmPlugin
} from '../index'

const testMarkdown = `# Chapter 1

This is the introduction to chapter 1. Click the **left side** of any heading to collapse/expand that section.

## Section 1.1

Content under section 1.1. This should collapse when "Chapter 1" is collapsed.

### Subsection 1.1.1

Deep nested content under section 1.1.

### Subsection 1.1.2

More deep content. These subsections should also hide when Section 1.1 or Chapter 1 is collapsed.

## Section 1.2

Content under section 1.2. This should remain visible when Section 1.1 is collapsed, but hidden when Chapter 1 is collapsed.

# Chapter 2

This is chapter 2. It should remain visible when Chapter 1 is collapsed.

## Section 2.1

Content under section 2.1.

### Deep Section

Some deeply nested content here.

#### Even Deeper

This should all hide when Section 2.1 or Chapter 2 is collapsed.

* A list item
* Another list item
* Yet another

## Section 2.2

Final section content.

# Appendix

Some appendix content.
`

function CollapseControls() {
  const toggleAll = usePublisher(toggleAllSections$)

  return (
    <div style={{ marginBottom: 8, display: 'flex', gap: 8 }}>
      <button
        onClick={() => {
          toggleAll(true)
        }}
      >
        Collapse All
      </button>
      <button
        onClick={() => {
          toggleAll(false)
        }}
      >
        Expand All
      </button>
    </div>
  )
}

const collapsibleSectionsWithControlsPlugin = realmPlugin({
  init(realm) {
    realm.pub(addTopAreaChild$, CollapseControls)
  }
})

export function CollapsibleSections() {
  return (
    <MDXEditor
      markdown={testMarkdown}
      plugins={[
        headingsPlugin(),
        listsPlugin(),
        quotePlugin(),
        linkPlugin(),
        thematicBreakPlugin(),
        markdownShortcutPlugin(),
        toolbarPlugin({
          toolbarContents: () => (
            <DiffSourceToggleWrapper>
              <UndoRedo />
            </DiffSourceToggleWrapper>
          )
        }),
        diffSourcePlugin(),
        collapsibleSectionsPlugin(),
        collapsibleSectionsWithControlsPlugin()
      ]}
      onChange={console.log}
    />
  )
}
