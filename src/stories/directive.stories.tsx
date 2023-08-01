import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $createParagraphNode, $insertNodes } from 'lexical'
import * as Mdast from 'mdast'
import { LeafDirective } from 'mdast-util-directive'
import React from 'react'
import { CustomLeafDirectiveEditor, MDXEditor, NestedEditor, ToolbarComponents, useMdastNodeUpdater } from '../'
import { DirectiveDescriptor } from '../plugins/directives'

export default {
  title: 'Custom directive editors'
}

const {
  BoldItalicUnderlineButtons,
  ToolbarSeparator,
  CodeFormattingButton,
  ListButtons,
  BlockTypeSelect,
  LinkButton,
  ImageButton,
  TableButton,
  HorizontalRuleButton,
  FrontmatterButton,
  CodeBlockButton,
  SandpackButton,
  DialogButton
} = ToolbarComponents

interface YoutubeDirectiveNode extends LeafDirective {
  name: 'youtube'
  attributes: { id: string }
}

const YoutubeDirectiveDescriptor: DirectiveDescriptor<YoutubeDirectiveNode> = {
  name: 'youtube',
  Editor: ({ mdastNode, directive, parentEditor }) => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
        <button
          onClick={() => {
            parentEditor.update(() => {
              directive.selectNext()
              directive.remove()
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

const YouTubeButton = () => {
  const [editor] = useLexicalComposerContext()
  return (
    <DialogButton
      tooltipTitle="Insert Youtube video"
      submitButtonTitle="Insert video"
      dialogInputPlaceholder="Paste the youtube video URL"
      buttonContent="YT"
      onSubmit={(url) => {
        const videoId = new URL(url).searchParams.get('v')
        if (videoId) {
          editor.update(() => {
            const youtubeDirectiveMdastNode: LeafDirective = {
              type: 'leafDirective',
              name: 'youtube',
              attributes: { id: videoId },
              children: []
            }
            const lexicalNode = $createLeafDirectiveNode(youtubeDirectiveMdastNode)
            $insertNodes([lexicalNode])

            if (lexicalNode.getParent()?.getLastChild() == lexicalNode) {
              lexicalNode.getParent()?.append($createParagraphNode())
            }
          })
        } else {
          alert('Invalid YouTube URL')
        }
      }}
    />
  )
}

const toolbarComponents = [
  BoldItalicUnderlineButtons,
  ToolbarSeparator,

  CodeFormattingButton,
  ToolbarSeparator,

  ListButtons,
  ToolbarSeparator,
  BlockTypeSelect,
  ToolbarSeparator,
  LinkButton,
  ImageButton,
  TableButton,
  HorizontalRuleButton,
  FrontmatterButton,

  ToolbarSeparator,

  CodeBlockButton,
  SandpackButton,
  ToolbarSeparator,
  YouTubeButton
]

export function Youtube() {
  return (
    <MDXEditor
      toolbarComponents={toolbarComponents}
      customLeafDirectiveEditors={[YoutubeEditor, CalloutEditor]}
      markdown={`
This should be an youtube video:

::youtube{#A5lXAKrttBU}

`}
    />
  )
}

interface CalloutDirectiveNode extends LeafDirective {
  name: 'callout'
  attributes: { type: string }
  children: Mdast.PhrasingContent[]
}

const CalloutEditor: CustomLeafDirectiveEditor<CalloutDirectiveNode> = {
  testNode: (mdastNode) => mdastNode.name === 'callout',
  Editor: ({ mdastNode }) => {
    const updateMdastNode = useMdastNodeUpdater()
    return (
      <div>
        Callout{' '}
        <input
          value={mdastNode.attributes.type}
          onChange={(e) => updateMdastNode({ ...mdastNode, attributes: { ...mdastNode.attributes, type: e.target.value } })}
        />
        <NestedEditor<CalloutDirectiveNode>
          getUpdatedMdastNode={(mdastNode, content) => {
            return { ...mdastNode, children: content }
          }}
          getContent={(mdastNode) => mdastNode.children}
          contentEditableProps={{
            style: { border: '1px solid red' }
          }}
        />
      </div>
    )
  }
}

export function Callout() {
  return (
    <MDXEditor
      customLeafDirectiveEditors={[CalloutEditor]}
      markdown={`
A callout editor:

::callout[there is some *markdown* in here]{type="info"}

`}
    />
  )
}
