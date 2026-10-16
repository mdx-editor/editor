import React from 'react'
import { MDXEditor } from '../MDXEditor'
import { frontmatterPlugin } from '../plugins/frontmatter'
import { toolbarPlugin } from '../plugins/toolbar'
import { InsertFrontmatter } from '../plugins/toolbar/components/InsertFrontmatter'
import { UndoRedo } from '../plugins/toolbar/components/UndoRedo'

export function StructuredFrontmatter() {
  const initial = '---\ntitle: Original\ncover:\n  src: /old.png\ntags: [one, two]\ndraft: false\n---\n\nBody'
  const [markdown, setMarkdown] = React.useState(initial)
  return (
    <>
      <MDXEditor
        markdown={initial}
        onChange={setMarkdown}
        plugins={[
          frontmatterPlugin(),
          toolbarPlugin({
            toolbarContents: () => (
              <>
                <InsertFrontmatter />
                <UndoRedo />
              </>
            )
          })
        ]}
      />
      <pre aria-label="Current Markdown">{markdown}</pre>
    </>
  )
}
