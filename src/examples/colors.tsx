import { $patchStyleText } from '@lexical/selection'
import { useCellValues } from '@mdxeditor/gurx'
import { $getRoot, $isTextNode, ElementNode, LexicalNode } from 'lexical'
import React from 'react'
import { DiffSourceToggleWrapper, MDXEditor, activeEditor$, currentSelection$, diffSourcePlugin, headingsPlugin, toolbarPlugin } from '../'

const markdownWithColors = `
  # Hello World

foo
bar

  A paragraph with <span style="color: red">some red text <span style="color: blue">with some blue nesting.</span> in here.</span> in it.
`

const ColorsToolbar = () => {
  const [currentSelection, activeEditor] = useCellValues(currentSelection$, activeEditor$)

  const currentColor = React.useMemo(() => {
    return (
      activeEditor?.getEditorState().read(() => {
        const selectedNodes = currentSelection?.getNodes() ?? []
        if (selectedNodes.length === 1) {
          let node: ElementNode | LexicalNode | null | undefined = selectedNodes[0]
          let style = ''
          while (!style && node && node !== $getRoot()) {
            if ($isTextNode(node)) {
              style = node.getStyle()
            }
            node = node.getParent()
          }
          return parseStyleString(style).color
        } else {
          return null
        }
      }) ?? null
    )
  }, [currentSelection, activeEditor])

  return (
    <>
      {['blue', 'red', 'green', 'orange', null].map((color) => {
        return (
          <button
            key={color}
            style={{
              border: currentColor === color ? '2px solid black' : '2px solid gray',
              width: '20px',
              height: '20px',
              backgroundColor: color ?? 'transparent'
            }}
            onClick={() => {
              if (activeEditor !== null && currentSelection !== null) {
                activeEditor.update(() => {
                  $patchStyleText(currentSelection, { color })
                })
              }
            }}
          ></button>
        )
      })}
    </>
  )
}

export function SpanWithColor() {
  return (
    <>
      <MDXEditor
        markdown={markdownWithColors}
        plugins={[
          headingsPlugin(),
          diffSourcePlugin(),
          toolbarPlugin({
            toolbarContents: () => (
              <DiffSourceToggleWrapper>
                <ColorsToolbar />
              </DiffSourceToggleWrapper>
            )
          })
        ]}
        onChange={(md) => {
          console.log('change', md)
        }}
      />
    </>
  )
}
function parseStyleString(styleString: string) {
  // Remove any leading/trailing spaces and semicolon
  styleString = styleString.trim().replace(/;$/, '')

  // Split into individual style declarations
  const declarations = styleString.split(';')

  // Create an object to store the parsed styles
  const styles: Record<string, string> = {}

  for (const declaration of declarations) {
    // Skip empty declarations
    if (!declaration.trim()) {
      continue
    }

    // Split each declaration into property and value
    const [property, value] = declaration.split(':').map((str) => str.trim())

    // Convert property from kebab-case to camelCase
    const camelProperty = property.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase())

    // Store in the styles object
    styles[camelProperty] = value
  }

  return styles
}
