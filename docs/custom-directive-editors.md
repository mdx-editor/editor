---
title: Directives
slug: custom-directive-editors
position: 0.81
---

# Directives

Markdown supports [custom constructs called directives](https://talk.commonmark.org/t/generic-directives-plugins-syntax/444), which can describe arbitrary content (a popular example of that being YouTube videos). 

```md
This is the syntax for a custom YouTube directive.

::youtube[Video of a cat in a box]{#01ab2cd3efg}
```

The directive plugin allows you to create custom editors for the various directives in your markdown source. To get started, you can use the bundled `GenericDirectiveEditor`:

```tsx

// markdown with a custom container directive
const markdown = `
:::callout
you better watch out!
::: 

`

const CalloutDirectiveDescriptor: DirectiveDescriptor = {
  name: 'callout',
  testNode(node) {
    return node.name === 'callout'
  },
  // set some attribute names to have the editor display a property editor popup.
  attributes: [],
  // used by the generic editor to determine whether or not to render a nested editor.
  hasChildren: true,
  Editor: GenericDirectiveEditor
}

export const CalloutEditor: React.FC = () => {
  return (
    <MDXEditor
      onChange={console.log}
      markdown={markdown}
      plugins={[directivesPlugin({ directiveDescriptors: [CalloutDirectiveDescriptor] })]}
    />
  )
}
```

If you need something more flexible, implement a custom directive editor. The example below creates a simple wrapper around the `NestedLexicalEditor` component:

```tsx
const CalloutCustomDirectiveDescriptor: DirectiveDescriptor = {
  name: 'callout',
  testNode(node) {
    return node.name === 'callout'
  },
  attributes: [],
  hasChildren: true,
  Editor: (props) => {
    return (
      <div style={{ border: '1px solid red', padding: 8, margin: 8 }}>
        <NestedLexicalEditor<ContainerDirective>
          block
          getContent={(node) => node.children}
          getUpdatedMdastNode={(mdastNode, children: any) => {
            return { ...mdastNode, children }
          }}
        />
      </div>
    )
  }
}
```

## Adding custom directive buttons to the toolbar

You can tap into the `directivesPlugin` state management exports to build an UI that inserts a custom directive node in the editor. 
Below you can find an example toolbar dialog button that will insert an YouTube directive based on user input.

```tsx
const YouTubeButton = () => {
  // grab the insertDirective action (a.k.a. publisher) from the 
  // state management system of the directivesPlugin
  const insertDirective = usePublisher(insertDirective$)

  return (
    <DialogButton
      tooltipTitle="Insert Youtube video"
      submitButtonTitle="Insert video"
      dialogInputPlaceholder="Paste the youtube video URL"
      buttonContent="YT"
      onSubmit={(url) => {
        const videoId = new URL(url).searchParams.get('v')
        if (videoId) {
          insertDirective({
            name: 'youtube',
            type: 'leafDirective',
            attributes: { id: videoId },
            children: []
          } as LeafDirective)
        } else {
          alert('Invalid YouTube URL')
        }
      }}
    />
  )
}

export const Youtube: React.FC = () => {
  return (
    <MDXEditor
      markdown={youtubeMarkdown}
      plugins={[
        directivesPlugin({ directiveDescriptors: [YoutubeDirectiveDescriptor] }),
        toolbarPlugin({
          toolbarContents: () => {
            return <YouTubeButton />
          }
        })
      ]}
    />
  )
}
```

## Update the directive attributes

The `useMdastNodeUpdater` hook returns a function that allows you to update the directive node attributes. 
You don't need to maintain a local state; the component gets re-rendered with the new mdast node property.

## Rendering custom directives in production

To replicate the custom directives behavior in "read" mode, you can use the [remark-directive](https://github.com/remarkjs/remark-directive) package to render directives up to your requirements. 
