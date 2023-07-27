import React from 'react'
import { MDXEditorCore } from '../MDXEditorCore'
import { DirectiveDescriptor, directivesPlugin } from '../plugins/directives/realmPlugin'
import { GenericDirectiveEditor } from '../directive-editors/GenericDirectiveEditor'
import { LeafDirective } from 'mdast-util-directive'
import { AdmonitionDirectiveDescriptor } from '../directive-editors/AdmonitionDirectiveDescriptor'
import admonitionMarkdown from './assets/admonition.md?raw'
import { linkPlugin } from '../plugins/link/realmPlugin'

const youtubeMarkdown = `
This should be an youtube video:

::youtube{#A5lXAKrttBU}
`

const GenericDirectiveDescriptor: DirectiveDescriptor = {
  name: 'directive',
  testNode() {
    return true
  },
  attributes: ['id'],
  hasChildren: true,
  Editor: GenericDirectiveEditor
}

interface YoutubeDirectiveNode extends LeafDirective {
  name: 'youtube'
  attributes: { id: string }
}

const youtubeDirectiveDescriptor: DirectiveDescriptor<YoutubeDirectiveNode> = {
  name: 'youtube',
  testNode(node) {
    return node.name === 'youtube'
  },
  attributes: ['id'],
  hasChildren: false,
  Editor: ({ mdastNode, lexicalNode, parentEditor }) => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
        <button
          onClick={() => {
            parentEditor.update(() => {
              lexicalNode.selectNext()
              lexicalNode.remove()
            })
          }}
        >
          delete
        </button>
        <iframe
          width="560"
          height="315"
          src={`https://www.youtube.com/embed/${mdastNode.attributes?.id}`}
          title="YouTube video player"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        ></iframe>
      </div>
    )
  }
}

export const Youtube: React.FC = () => {
  return <MDXEditorCore markdown={youtubeMarkdown} plugins={[directivesPlugin({ directiveDescriptors: [youtubeDirectiveDescriptor] })]} />
}

const genericMarkdown = `
a text directive :d{#id} with some text.

::leaf[some content]{#meh}

text

:::block{#id}

Some **markdown**

:::
`

export const CatchAll: React.FC = () => {
  return <MDXEditorCore markdown={genericMarkdown} plugins={[directivesPlugin({ directiveDescriptors: [GenericDirectiveDescriptor] })]} />
}

export const Admonitions: React.FC = () => {
  return (
    <MDXEditorCore
      onChange={console.log}
      markdown={admonitionMarkdown}
      plugins={[directivesPlugin({ directiveDescriptors: [AdmonitionDirectiveDescriptor] }), linkPlugin()]}
    />
  )
}
