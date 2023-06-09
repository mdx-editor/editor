import React from 'react'
import { MDXEditor, ToolbarComponents } from '../'

const markdown = `
# Hey there!
This is a mini **live mdxeditor demo** that you can try. The tools in here are a sample of what's available.
you can do formatting, linking, code blocks, tables, and more.

Here's a link to [the website](https://mdxeditor.com). Focus your cursor on it.

## This is a level 2 heading 

And a paragraph. change its type from the dropdown above.
`

export function HomepageMiniEditor() {
  return (
    <div style={{ width: 540 }}>
      <MDXEditor
        markdown={markdown}
        toolbarComponents={[
          ToolbarComponents.BoldItalicUnderlineButtons,
          ToolbarComponents.ToolbarSeparator,
          ToolbarComponents.LinkButton,
          ToolbarComponents.BlockTypeSelect,
        ]}
      />
    </div>
  )
}
