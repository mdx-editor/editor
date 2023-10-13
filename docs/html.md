---
title: HTML Support
slug: html-support
position: 98
---

# HTML Support

Markdown documents can occasionally include additional HTML elements. Out of the box, MDXEditor converts those into 
generic HTML nodes, which extend [Lexical's Element nodes](https://lexical.dev/docs/concepts/nodes#elementnode). This allows the user to edit the HTML content (i.e. the nested markdown inside those elements). 

**Note:** while using HTML can be tempting (and easy when it comes to parsing/rendering afterwards), it goes against the principles of markdown being human-readable, limited by intention format. If you need to extend the tooling available, it's better to consider directives and custom JSX components instead.

Out of the box, the editor does not include UI that allows the user to add, remove or configure the HTML elements' properties. You can, however use the Lexical API to build toolbar components that do so. Below is a simple example of a toolbar component that lets the user change the CSS class of the element under the cursor. You can replace the input with a dropdown or an UI of your choice. 


```tsx
const HTMLToolbarComponent = () => {
  const [currentSelection, activeEditor] = corePluginHooks.useEmitterValues('currentSelection', 'activeEditor')

  const currentHTMLNode = React.useMemo(() => {
    return (
      activeEditor?.getEditorState().read(() => {
        const selectedNodes = currentSelection?.getNodes() || []
        if (selectedNodes.length === 1) {
          return $getNearestNodeOfType(selectedNodes[0], GenericHTMLNode)
        } else {
          return null
        }
      }) || null
    )
  }, [currentSelection, activeEditor])

  return (
    <>
      <input
        disabled={currentHTMLNode === null}
        value={getCssClass(currentHTMLNode)}
        onChange={(e) => {
          activeEditor?.update(
            () => {
              const attributesWithoutClass = currentHTMLNode?.getAttributes().filter((attr) => attr.name !== 'class') || []
              const newClassAttr: MdxJsxAttribute = { type: 'mdxJsxAttribute', name: 'class', value: e.target.value }
              currentHTMLNode?.updateAttributes([...attributesWithoutClass, newClassAttr])
            },
            { discrete: true }
          )
          e.target.focus()
        }}
      />
    </>
  )
}

function getCssClass(node: GenericHTMLNode | null) {
  return (node?.getAttributes().find((attr) => attr.name === 'class')?.value as string) ?? ''
}
```

