import React from 'react'
import { MDXEditor } from '../'
import { CustomLeafDirectiveEditor } from '../types/NodeDecoratorsProps'
import { LeafDirective } from 'mdast-util-directive'

interface YoutubeDirectiveNode extends LeafDirective {
  name: 'youtube'
  attributes: { id: string }
}

const YoutubeEditor: CustomLeafDirectiveEditor<YoutubeDirectiveNode> = {
  testNode: (mdastNode) => mdastNode.name === 'youtube',
  Editor: ({ mdastNode, leafDirective, parentEditor }) => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
        <button
          onClick={() => {
            parentEditor.update(() => {
              leafDirective.selectNext()
              leafDirective.remove()
            })
          }}
        >
          delete
        </button>
        <iframe
          width="560"
          height="315"
          src={`https://www.youtube.com/embed/${mdastNode.attributes.id}`}
          title="YouTube video player"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        ></iframe>
      </div>
    )
  }
}

export function Hello() {
  return (
    <MDXEditor
      customLeafDirectiveEditors={[YoutubeEditor]}
      markdown={`
This should be an youtube video:

::youtube{#n_uFzLPYDd8}

`}
    />
  )
}
