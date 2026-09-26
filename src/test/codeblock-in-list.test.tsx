import { render } from '@testing-library/react'
import { $createParagraphNode, $createTextNode, $getRoot, createEditor, ParagraphNode, TextNode, type LexicalNode } from 'lexical'
import { $createLinkNode, LinkNode } from '@lexical/link'
import { $createListItemNode, $createListNode, ListItemNode, ListNode, registerList } from '@lexical/list'
import React from 'react'
import { describe, expect, it } from 'vitest'
import { MDXEditor, type CodeBlockEditorDescriptor, type MDXEditorMethods } from '../'
import { codeBlockPlugin } from '../plugins/codeblock'
import { $createCodeBlockNode, CodeBlockNode } from '../plugins/codeblock/CodeBlockNode'
import { $insertDecoratorNodeAtSelection } from '../plugins/core'
import { listsPlugin } from '../plugins/lists'

// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

const anyCodeBlockDescriptor: CodeBlockEditorDescriptor = {
  priority: 0,
  match: () => true,
  Editor: () => null
}

const listPlugins = [listsPlugin(), codeBlockPlugin({ codeBlockEditorDescriptors: [anyCodeBlockDescriptor] })]

/** Renders the lexical tree as indented lines so that nesting can be asserted. */
function describeTree(node: LexicalNode, depth = 0): string[] {
  const lines = ['  '.repeat(depth) + node.getType()]
  if ('getChildren' in node) {
    for (const child of (node as unknown as { getChildren: () => LexicalNode[] }).getChildren()) {
      lines.push(...describeTree(child, depth + 1))
    }
  }
  return lines
}

function createListEditor() {
  const editor = createEditor({
    namespace: 'codeblock-in-list',
    nodes: [ParagraphNode, TextNode, LinkNode, ListItemNode, ListNode, CodeBlockNode],
    onError(error) {
      throw error
    }
  })
  registerList(editor)
  return editor
}

const newCodeBlock = () => $createCodeBlockNode({ code: '', language: '', meta: '' })

describe('code blocks inside list items (#788)', () => {
  it('round-trips a code block that is nested in a list item', () => {
    const ref = React.createRef<MDXEditorMethods>()
    const markdown = ['1. first item', '2. second item', '', '    ```js', '    const a = 1', '    ```'].join('\n')

    render(<MDXEditor ref={ref} markdown={markdown} plugins={listPlugins} />)

    expect(ref.current?.getMarkdown().trim()).toEqual('1. first item\n2. second item\n   ```js\n   const a = 1\n   ```')
  })

  it('inserts a block decorator into the list item that holds the selection', () => {
    const editor = createListEditor()
    let tree: string[] = []

    editor.update(() => {
      const list = $createListNode('number')
      list.append($createListItemNode().append($createTextNode('first item')), $createListItemNode().append($createTextNode('second item')))
      $getRoot().append(list)
      const lastDescendant = list.getLastDescendant()
      if (lastDescendant === null) {
        throw new Error('the seeded list is empty')
      }
      lastDescendant.selectEnd()

      $insertDecoratorNodeAtSelection(newCodeBlock())
    })
    editor.update(() => {
      tree = describeTree($getRoot())
    })

    // The list is left intact (two items, no split) and the code block lives inside the second item.
    expect(tree).toEqual(['root', '  list', '    listitem', '      text', '    listitem', '      text', '      codeblock'])
  })

  it('still hoists a block decorator to the root when the selection is not inside a list', () => {
    const editor = createListEditor()
    let tree: string[] = []

    editor.update(() => {
      const paragraph = $createParagraphNode().append($createTextNode('plain text'))
      $getRoot().append(paragraph)
      paragraph.selectEnd()

      $insertDecoratorNodeAtSelection(newCodeBlock())
    })
    editor.update(() => {
      tree = describeTree($getRoot())
    })

    expect(tree).toEqual(['root', '  paragraph', '    text', '  codeblock', '  paragraph'])
  })

  it('splits the list item text at the caret', () => {
    const editor = createListEditor()
    let tree: string[] = []
    let texts: string[] = []

    editor.update(() => {
      const text = $createTextNode('beforeafter')
      $getRoot().append($createListNode('number').append($createListItemNode().append(text)))
      text.select(6, 6)

      $insertDecoratorNodeAtSelection(newCodeBlock())
    })
    editor.update(() => {
      tree = describeTree($getRoot())
      texts = $getRoot()
        .getAllTextNodes()
        .map((node) => node.getTextContent())
    })

    expect(tree).toEqual(['root', '  list', '    listitem', '      text', '      codeblock', '      text'])
    expect(texts).toEqual(['before', 'after'])
  })

  it('keeps the block out of an inline element that holds the caret', () => {
    const editor = createListEditor()
    let tree: string[] = []

    editor.update(() => {
      const linkText = $createTextNode('linktext')
      $getRoot().append(
        $createListNode('bullet').append($createListItemNode().append($createLinkNode('https://example.com').append(linkText)))
      )
      linkText.select(4, 4)

      $insertDecoratorNodeAtSelection(newCodeBlock())
    })
    editor.update(() => {
      tree = describeTree($getRoot())
    })

    expect(tree).toEqual(['root', '  list', '    listitem', '      link', '        text', '      codeblock', '      link', '        text'])
  })
})
