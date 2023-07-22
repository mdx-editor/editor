import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $createParagraphNode, $insertNodes } from 'lexical'
import { LeafDirective } from 'mdast-util-directive'
import React from 'react'
import { $createLeafDirectiveNode, MDXEditor, ToolbarComponents } from '../'

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

export function Hello() {
  return (
    <MDXEditor
      toolbarComponents={toolbarComponents}
      markdown={`
This should be an youtube video:

::youtube{#A5lXAKrttBU}

::callout[there is some *markdown* in here]
`}
    />
  )
}
