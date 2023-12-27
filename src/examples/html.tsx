import React from 'react'
import {
  DiffSourceToggleWrapper,
  MDXEditor,
  diffSourcePlugin,
  headingsPlugin,
  toolbarPlugin,
  $createGenericHTMLNode,
  activeEditor$,
  currentSelection$
} from '../'
import { $patchStyleText } from '@lexical/selection'
import { $getRoot, $getSelection, $isRangeSelection, $isTextNode, ElementNode, LexicalNode } from 'lexical'
import { $isGenericHTMLNode } from '../plugins/core/GenericHTMLNode'
import { GenericHTMLNode } from '../plugins/core/GenericHTMLNode'
import { MdxJsxAttribute } from 'mdast-util-mdx'
import { $getNearestNodeOfType } from '@lexical/utils'
import { useCellValues } from '@mdxeditor/gurx'

const markdownWithSpan = `
  # Hello World

  A paragraph with <span style="color: red" class="some">some red text <span style="color: blue">with some blue nesting.</span> in here.</span> in it.
`

export function SpanWithColor() {
  return (
    <>
      <MDXEditor
        markdown={markdownWithSpan}
        plugins={[
          headingsPlugin(),
          diffSourcePlugin(),
          toolbarPlugin({
            toolbarContents: () => (
              <DiffSourceToggleWrapper>
                <HTMLToolbarComponent />
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

const HTMLToolbarComponent = () => {
  const [currentSelection, activeEditor] = useCellValues(currentSelection$, activeEditor$)

  const currentStyle = React.useMemo(() => {
    return (
      activeEditor?.getEditorState().read(() => {
        const selectedNodes = currentSelection?.getNodes() || []
        if (selectedNodes.length === 1) {
          let node: ElementNode | LexicalNode | null | undefined = selectedNodes[0]
          let style = ''
          while (!style && node && node !== $getRoot()) {
            if ($isTextNode(node) || $isGenericHTMLNode(node)) {
              style = node.getStyle()
            }
            node = node?.getParent()
          }
          return style
        } else {
          return ''
        }
      }) || ''
    )
  }, [currentSelection, activeEditor])

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
      <button
        onClick={() => {
          if (activeEditor !== null && currentSelection !== null) {
            activeEditor.update(() => {
              $patchStyleText(currentSelection, { color: 'orange' })
            })
          }
        }}
      >
        Make selection orange
      </button>
      <button
        onClick={() => {
          if (activeEditor !== null && currentSelection !== null) {
            activeEditor.update(() => {
              $patchStyleText(currentSelection, { 'font-size': '20px' })
            })
          }
        }}
      >
        Big font size
      </button>
      {currentStyle && <div>Current style: {currentStyle}</div>}
      current css class:{' '}
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
      <button
        disabled={currentHTMLNode === null}
        onClick={() => {
          if (activeEditor !== null && currentSelection !== null) {
            activeEditor.update(() => {
              //  const children = currentHTMLNode?.getChildren() || []
              currentHTMLNode?.remove()
              const selection = $getSelection()
              selection?.insertNodes(currentHTMLNode?.getChildren() || [])
            })
          }
        }}
      >
        remove HTML node
      </button>
      <button
        onClick={() => {
          if (activeEditor !== null && currentSelection !== null) {
            activeEditor.update(() => {
              const selection = $getSelection()
              if ($isRangeSelection(selection)) {
                const selectedNodes = selection.getNodes()
                const currentTextNode = selectedNodes.length === 1 && $isTextNode(selectedNodes[0]) ? selectedNodes[0] : null
                if (currentTextNode) {
                  const attributes = Object.entries({ style: 'color: green' }).map(([name, value]) => ({
                    type: 'mdxJsxAttribute' as const,
                    name,
                    value
                  }))

                  const newNode = $createGenericHTMLNode('span', 'mdxJsxTextElement', attributes)
                  selection?.insertNodes([newNode])

                  // newNode.insertAfter(slicedPortion)
                  // newNode.append(slicedPortion)

                  /*


                  $wrapNodeInElement(slicedPortion, () => )
                  */
                }
              }
            })
          }
        }}
      >
        wrap in a red span
      </button>
    </>
  )
}

function getCssClass(node: GenericHTMLNode | null) {
  return (node?.getAttributes().find((attr) => attr.name === 'class')?.value as string) ?? ''
}
