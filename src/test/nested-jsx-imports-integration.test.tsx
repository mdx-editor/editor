import React from 'react'
import { act, fireEvent, render, waitFor } from '@testing-library/react'
import { expect, it } from 'vitest'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $getRoot, $isElementNode, type LexicalEditor } from 'lexical'
import { addNestedEditorChild$, addTableCellEditorChild$ } from '../plugins/core'
import { AdmonitionDirectiveDescriptor } from '../directive-editors/AdmonitionDirectiveDescriptor'
import { directivesPlugin } from '../plugins/directives'
import { tablePlugin } from '../plugins/table'
import { GenericJsxEditor } from '../jsx-editors/GenericJsxEditor'
import { jsxPlugin } from '../plugins/jsx'
import { MDXEditor, type MDXEditorMethods } from '../MDXEditor'
import { realmPlugin } from '../RealmWithPlugins'
import { $createLexicalJsxNode } from '../plugins/jsx/LexicalJsxNode'

// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

it('imports a JSX component inserted into an admonition at the document root', async () => {
  let nestedEditor: LexicalEditor | null = null
  function CaptureNestedEditor() {
    const [editor] = useLexicalComposerContext()
    nestedEditor ??= editor
    return null
  }
  const captureNestedEditorPlugin = realmPlugin({
    init(realm) {
      realm.pub(addNestedEditorChild$, CaptureNestedEditor)
    }
  })
  const ref = React.createRef<MDXEditorMethods>()
  const { container } = render(
    <MDXEditor
      ref={ref}
      markdown={':::tip\nInside the admonition\n:::'}
      plugins={[
        captureNestedEditorPlugin(),
        directivesPlugin({ directiveDescriptors: [AdmonitionDirectiveDescriptor] }),
        jsxPlugin({
          jsxComponentDescriptors: [
            {
              name: 'Zazz',
              kind: 'flow',
              source: '@zazz',
              defaultExport: true,
              props: [],
              hasChildren: false,
              Editor: GenericJsxEditor
            }
          ]
        })
      ]}
    />
  )
  await waitFor(() => {
    expect(nestedEditor).not.toBeNull()
    expect(container.querySelectorAll('[contenteditable="true"]')).toHaveLength(2)
  })
  act(() => {
    nestedEditor!.update(
      () => {
        $getRoot().append($createLexicalJsxNode({ type: 'mdxJsxFlowElement', name: 'Zazz', attributes: [], children: [] }))
      },
      { discrete: true }
    )
  })
  fireEvent.blur(container.querySelectorAll('[contenteditable="true"]')[1])
  await waitFor(() => {
    expect(ref.current?.getMarkdown()).toContain('<Zazz />')
  })
  expect(ref.current?.getMarkdown()).toMatch(/^import Zazz from '@zazz'/)
})

it('preserves existing nested imports when a new component is inserted and the document is reloaded', async () => {
  let nestedEditor: LexicalEditor | null = null
  function CaptureNestedEditor() {
    const [editor] = useLexicalComposerContext()
    nestedEditor ??= editor
    return null
  }
  const capture = realmPlugin({
    init: (realm) => {
      realm.pub(addNestedEditorChild$, CaptureNestedEditor)
    }
  })
  const ref = React.createRef<MDXEditorMethods>()
  const { container } = render(
    <MDXEditor
      ref={ref}
      markdown={":::tip\nimport Existing from '@existing'\n\n<Existing />\n:::"}
      plugins={[
        capture(),
        directivesPlugin({ directiveDescriptors: [AdmonitionDirectiveDescriptor] }),
        jsxPlugin({
          jsxComponentDescriptors: [
            { name: 'Zazz', kind: 'flow', source: '@zazz', defaultExport: true, props: [], hasChildren: false, Editor: GenericJsxEditor },
            { name: '*', kind: 'flow', props: [], hasChildren: false, Editor: GenericJsxEditor }
          ]
        })
      ]}
    />
  )
  await waitFor(() => {
    expect(nestedEditor).not.toBeNull()
  })
  act(() => {
    nestedEditor!.update(
      () => {
        $getRoot().append($createLexicalJsxNode({ type: 'mdxJsxFlowElement', name: 'Zazz', attributes: [], children: [] }))
      },
      { discrete: true }
    )
  })
  fireEvent.blur(container.querySelectorAll('[contenteditable="true"]')[1])
  await waitFor(() => {
    expect(ref.current?.getMarkdown()).toContain('<Zazz />')
  })
  const markdown = ref.current!.getMarkdown()
  expect(markdown).toMatch(/^import Zazz from '@zazz'/)
  expect(markdown).toContain(":::tip\nimport Existing from '@existing'")
  expect(markdown.match(/import Existing/g)).toHaveLength(1)
  act(() => {
    ref.current!.setMarkdown(markdown)
  })
  await waitFor(() => {
    expect(ref.current!.getMarkdown()).toBe(markdown)
  })
})

it('exports a component inserted into a table cell without losing the cell content', async () => {
  const tableEditors: LexicalEditor[] = []
  function CaptureTableEditor() {
    const [editor] = useLexicalComposerContext()
    if (!tableEditors.includes(editor)) tableEditors.push(editor)
    return null
  }
  const capture = realmPlugin({
    init: (realm) => {
      realm.pub(addTableCellEditorChild$, CaptureTableEditor)
    }
  })
  const ref = React.createRef<MDXEditorMethods>()
  const { container } = render(
    <MDXEditor
      ref={ref}
      markdown={'| Header |\n| --- |\n| Cell |'}
      plugins={[
        capture(),
        tablePlugin(),
        jsxPlugin({
          jsxComponentDescriptors: [
            { name: 'Badge', kind: 'text', source: '@components', props: [], hasChildren: false, Editor: GenericJsxEditor }
          ]
        })
      ]}
    />
  )
  await waitFor(() => {
    expect(tableEditors).toHaveLength(2)
  })
  act(() => {
    tableEditors[1].update(
      () => {
        const paragraph = $getRoot().getFirstChildOrThrow()
        if (!$isElementNode(paragraph)) throw new Error('Expected a table-cell paragraph')
        paragraph.append($createLexicalJsxNode({ type: 'mdxJsxTextElement', name: 'Badge', attributes: [], children: [] }))
      },
      { discrete: true }
    )
  })
  fireEvent.blur(container.querySelector('td [contenteditable="true"]')!)
  await waitFor(() => {
    expect(ref.current?.getMarkdown()).toContain('<Badge />')
  })
  expect(ref.current?.getMarkdown()).toMatch(/^import \{ Badge \} from '@components'/)
  expect(ref.current?.getMarkdown()).toContain('Cell<Badge />')
})
