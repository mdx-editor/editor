import { HeadingNode } from '@lexical/rich-text'
import { $nodesOfType } from 'lexical'
import React from 'react'
import { MDXEditor, headingsPlugin, realmPlugin } from '../'
import { createRootEditorSubscription$ } from '../plugins/core'

// Table of contents item structure
interface TOCItem {
  text: string
  level: 1 | 2 | 3 | 4 | 5 | 6
  key: string
}

interface TOCPluginOptions {
  onUpdate?: (items: TOCItem[]) => void
}

// Custom plugin to extract and track headings
const tocPlugin = realmPlugin<TOCPluginOptions>({
  init: (realm, params) => {
    // Register editor update listener
    realm.pub(createRootEditorSubscription$, (editor) => {
      return editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          // Get all HeadingNode instances
          const headingNodes = $nodesOfType(HeadingNode)

          // Extract TOC items
          const items: TOCItem[] = headingNodes.map((node) => ({
            text: node.getTextContent(),
            level: parseInt(node.getTag()[1]) as 1 | 2 | 3 | 4 | 5 | 6,
            key: node.getKey()
          }))

          params?.onUpdate?.(items)
        })
      })
    })
  }
})

// TOC Display Component
function TableOfContentsSidebar({ tocItems }: { tocItems: TOCItem[] }) {
  return (
    <div
      style={{
        width: '250px',
        padding: '16px',
        borderRight: '1px solid #ccc',
        maxHeight: '600px',
        overflowY: 'auto'
      }}
    >
      <h3>Table of Contents</h3>
      {tocItems.length === 0 ? (
        <p style={{ color: '#999' }}>No headings yet</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {tocItems.map((item) => (
            <li
              key={item.key}
              style={{
                marginLeft: `${(item.level - 1) * 16}px`,
                marginBottom: '8px',
                fontSize: '14px'
              }}
            >
              <span style={{ fontWeight: 'bold', color: '#666' }}>H{item.level}:</span> {item.text}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// Main Example Component
export function TableOfContents() {
  const [tocItems, setTocItems] = React.useState<TOCItem[]>([])
  return (
    <div style={{ display: 'flex', gap: '16px' }}>
      <TableOfContentsSidebar tocItems={tocItems} />
      <div style={{ flex: 1 }}>
        <MDXEditor
          markdown={`# Welcome to MDXEditor

## Introduction
This is a sample document with multiple headings.

### Getting Started
Add or modify headings to see the table of contents update.

## Features
### Real-time Updates
The TOC updates as you type.

### Multiple Levels
All heading levels (h1-h6) are supported.

## Conclusion
Try editing the headings above!`}
          plugins={[headingsPlugin(), tocPlugin({ onUpdate: setTocItems })]}
        />
      </div>
    </div>
  )
}
