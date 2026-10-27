import React from 'react'
import { act, fireEvent, render, waitFor } from '@testing-library/react'
import { expect, it } from 'vitest'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $getRoot, $createParagraphNode, $createTextNode, $isElementNode, type LexicalEditor } from 'lexical'
import { addNestedEditorChild$, addTableCellEditorChild$ } from '../plugins/core'
import { AdmonitionDirectiveDescriptor } from '../directive-editors/AdmonitionDirectiveDescriptor'
import { directivesPlugin } from '../plugins/directives'
import { tablePlugin } from '../plugins/table'
import { GenericJsxEditor } from '../jsx-editors/GenericJsxEditor'
import { jsxPlugin } from '../plugins/jsx'
import { MDXEditor, type MDXEditorMethods } from '../MDXEditor'
import { realmPlugin } from '../RealmWithPlugins'
import { $createLexicalJsxNode } from '../plugins/jsx/LexicalJsxNode'
import type { ComponentImport } from '../plugins/jsx/imports'

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

it.each(['exact', 'wildcard'] as const)(
  'preserves one nested declaration with a source-backed %s descriptor after save and reload',
  async (kind) => {
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
              {
                name: kind === 'exact' ? 'Existing' : '*',
                kind: 'flow',
                source: kind === 'exact' ? '@existing' : '@fallback',
                defaultExport: kind === 'exact',
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
    const saved = ref.current!.getMarkdown()
    expect(saved).toMatch(/^import Zazz from '@zazz'/)
    expect(saved).toContain(":::tip\nimport Existing from '@existing'")
    expect(saved.match(/import Existing/g)).toHaveLength(1)
    expect(saved).not.toContain('@fallback')
    act(() => {
      ref.current!.setMarkdown(saved)
    })
    await waitFor(() => {
      expect(ref.current!.getMarkdown()).toBe(saved)
    })
  }
)

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

it.each([false, true])('exports a table-cell component without losing content (existing import: %s)', async (existingImport) => {
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
        const originalImport: ComponentImport = {
          source: '@original',
          defaultExport: false,
          kind: 'named',
          importedName: 'Original',
          localName: 'Badge'
        }
        paragraph.append(
          $createLexicalJsxNode(
            { type: 'mdxJsxTextElement', name: 'Badge', attributes: [], children: [] },
            existingImport ? originalImport : undefined
          )
        )
      },
      { discrete: true }
    )
  })
  fireEvent.blur(container.querySelector('td [contenteditable="true"]')!)
  await waitFor(() => {
    expect(ref.current?.getMarkdown()).toContain('<Badge />')
  })
  expect(ref.current?.getMarkdown()).toContain(
    existingImport ? "import { Original as Badge } from '@original'" : "import { Badge } from '@components'"
  )
  expect(ref.current?.getMarkdown()).toContain('Cell<Badge />')
})

it.each([
  ["import { Foo } from './custom'", 'Foo'],
  ["import { Foo as Bar } from './custom'", 'Bar'],
  ["import Foo from './custom'", 'Foo'],
  ["import * as UI from './custom'", 'UI.Badge']
])('preserves the root declaration %s used only inside an admonition', async (declaration, name) => {
  let nestedEditor: LexicalEditor | null = null
  function Capture() {
    const [editor] = useLexicalComposerContext()
    nestedEditor ??= editor
    return null
  }
  const capture = realmPlugin({
    init: (realm) => {
      realm.pub(addNestedEditorChild$, Capture)
    }
  })
  const ref = React.createRef<MDXEditorMethods>()
  const { container } = render(
    <MDXEditor
      ref={ref}
      markdown={`${declaration}\n\n:::tip\n<${name} />\n:::`}
      plugins={[
        capture(),
        directivesPlugin({ directiveDescriptors: [AdmonitionDirectiveDescriptor] }),
        jsxPlugin({
          jsxComponentDescriptors: [
            { name: '*', kind: 'flow', source: '@fallback', props: [], hasChildren: false, Editor: GenericJsxEditor }
          ]
        })
      ]}
    />
  )
  await waitFor(() => {
    expect(ref.current?.getMarkdown()).toContain(declaration)
  })
  await waitFor(() => {
    expect(nestedEditor).not.toBeNull()
  })
  const editable = container.querySelectorAll('[contenteditable="true"]')[1]
  fireEvent.focus(editable)
  act(() => {
    nestedEditor!.update(
      () => {
        $getRoot().append($createParagraphNode().append($createTextNode('changed')))
      },
      { discrete: true }
    )
  })
  fireEvent.blur(editable)
  await waitFor(() => {
    expect(ref.current!.getMarkdown()).toContain('changed')
  })
  const markdown = ref.current!.getMarkdown()
  expect(markdown).not.toContain('@fallback')
  expect(markdown.match(/import /g)).toHaveLength(1)
  act(() => {
    ref.current!.setMarkdown(markdown)
  })
  await waitFor(() => {
    expect(ref.current!.getMarkdown()).toBe(markdown)
  })
})

it('retains one root import shared by two independently saved directives', async () => {
  const editors: LexicalEditor[] = []
  function Capture() {
    const [e] = useLexicalComposerContext()
    if (!editors.includes(e)) editors.push(e)
    return null
  }
  const capture = realmPlugin({
    init: (realm) => {
      realm.pub(addNestedEditorChild$, Capture)
    }
  })
  const ref = React.createRef<MDXEditorMethods>()
  const { container } = render(
    <MDXEditor
      ref={ref}
      markdown={"import { Foo } from './custom'\n\n:::tip\n<Foo />\n:::\n\n:::tip\n<Foo />\n:::"}
      plugins={[
        capture(),
        directivesPlugin({ directiveDescriptors: [AdmonitionDirectiveDescriptor] }),
        jsxPlugin({
          jsxComponentDescriptors: [
            { name: '*', kind: 'flow', source: '@fallback', props: [], hasChildren: false, Editor: GenericJsxEditor }
          ]
        })
      ]}
    />
  )
  await waitFor(() => {
    expect(editors.length).toBe(2)
  })
  for (let index = 0; index < 2; index++) {
    act(() => {
      editors[index].update(
        () => {
          $getRoot().append($createParagraphNode().append($createTextNode('changed')))
        },
        { discrete: true }
      )
    })
    fireEvent.blur(container.querySelectorAll('[contenteditable="true"]')[index + 1])
  }
  await waitFor(() => {
    expect(ref.current!.getMarkdown()).toContain('changed')
  })
  const markdown = ref.current!.getMarkdown()
  expect(markdown.match(/import \{ Foo \}/g)).toHaveLength(1)
  act(() => {
    ref.current!.setMarkdown(markdown)
  })
  await waitFor(() => {
    expect(ref.current!.getMarkdown()).toBe(markdown)
  })
})

it('retains an imported JSX child after saving an inline JSX editor', async () => {
  const editors: LexicalEditor[] = []
  function Capture() {
    const [e] = useLexicalComposerContext()
    if (!editors.includes(e)) editors.push(e)
    return null
  }
  const capture = realmPlugin({
    init: (realm) => {
      realm.pub(addNestedEditorChild$, Capture)
    }
  })
  const ref = React.createRef<MDXEditorMethods>()
  const { container } = render(
    <MDXEditor
      ref={ref}
      markdown={"import { Badge } from './custom'\n\nText <Outer><Badge /></Outer>"}
      plugins={[
        capture(),
        jsxPlugin({
          jsxComponentDescriptors: [
            { name: 'Outer', kind: 'text', props: [], hasChildren: true, Editor: GenericJsxEditor },
            { name: 'Badge', kind: 'text', source: '@fallback', props: [], hasChildren: false, Editor: GenericJsxEditor }
          ]
        })
      ]}
    />
  )
  await waitFor(() => {
    expect(editors.length).toBe(1)
  })
  act(() => {
    editors[0].update(
      () => {
        const first = $getRoot().getFirstChildOrThrow()
        if ($isElementNode(first)) first.append($createTextNode('changed'))
      },
      { discrete: true }
    )
  })
  fireEvent.blur(container.querySelectorAll('[contenteditable="true"]')[1])
  await waitFor(() => {
    expect(ref.current!.getMarkdown()).toContain('changed')
  })
  expect(ref.current!.getMarkdown()).toContain('<Badge />')
})

import { GenericDirectiveEditor } from '../directive-editors/GenericDirectiveEditor'
it.each([':note[<Badge />]', '::note[<Badge />]'])('retains imported JSX in directive %s after saving', async (content) => {
  const editors: LexicalEditor[] = []
  function Capture() {
    const [e] = useLexicalComposerContext()
    if (!editors.includes(e)) editors.push(e)
    return null
  }
  const capture = realmPlugin({
    init: (realm) => {
      realm.pub(addNestedEditorChild$, Capture)
    }
  })
  const ref = React.createRef<MDXEditorMethods>()
  const { container } = render(
    <MDXEditor
      ref={ref}
      markdown={"import { Badge } from './custom'\n\n" + content}
      plugins={[
        capture(),
        directivesPlugin({
          directiveDescriptors: [
            { name: 'note', testNode: (node) => node.name === 'note', attributes: [], hasChildren: true, Editor: GenericDirectiveEditor }
          ]
        }),
        jsxPlugin({
          jsxComponentDescriptors: [
            { name: 'Badge', kind: 'text', source: '@fallback', props: [], hasChildren: false, Editor: GenericJsxEditor }
          ]
        })
      ]}
    />
  )
  await waitFor(() => {
    expect(editors.length).toBe(1)
  })
  act(() => {
    editors[0].update(
      () => {
        const first = $getRoot().getFirstChildOrThrow()
        if ($isElementNode(first)) first.append($createTextNode('changed'))
      },
      { discrete: true }
    )
  })
  fireEvent.blur(container.querySelectorAll('[contenteditable="true"]')[1])
  await waitFor(() => {
    expect(ref.current!.getMarkdown()).toContain('changed')
  })
  expect(ref.current!.getMarkdown()).toContain('<Badge />')
})

it('keeps a directive-local import in place when its JSX is wrapped in HTML', async () => {
  const editors: LexicalEditor[] = []
  function Capture() {
    const [e] = useLexicalComposerContext()
    if (!editors.includes(e)) editors.push(e)
    return null
  }
  const capture = realmPlugin({
    init: (realm) => {
      realm.pub(addNestedEditorChild$, Capture)
    }
  })
  const ref = React.createRef<MDXEditorMethods>()
  const { container } = render(
    <MDXEditor
      ref={ref}
      markdown={":::tip\nimport { Badge } from './custom'\n\n<span><Badge /></span>\n:::"}
      plugins={[
        capture(),
        directivesPlugin({ directiveDescriptors: [AdmonitionDirectiveDescriptor] }),
        jsxPlugin({
          jsxComponentDescriptors: [
            { name: 'Badge', kind: 'text', source: '@fallback', props: [], hasChildren: false, Editor: GenericJsxEditor }
          ]
        })
      ]}
    />
  )
  await waitFor(() => {
    expect(editors.length).toBe(1)
  })
  act(() => {
    editors[0].update(
      () => {
        $getRoot().append($createParagraphNode().append($createTextNode('changed')))
      },
      { discrete: true }
    )
  })
  fireEvent.blur(container.querySelectorAll('[contenteditable="true"]')[1])
  await waitFor(() => {
    expect(ref.current!.getMarkdown()).toContain('changed')
  })
  expect(ref.current!.getMarkdown()).toContain(":::tip\nimport { Badge } from './custom'")
})

it.each([
  ["import { A } from './a'\nimport { B } from './b'", "import { A } from './a'"],
  ["import { A } from './a'\nexport const meta = 1", "import { A } from './a'"],
  ["import Default, { Original as A, B } from './a'", "import { Original as A } from './a'"]
])('rebuilds only used root import specifiers from %s', async (declarations, expectedImport) => {
  const ref = React.createRef<MDXEditorMethods>()
  render(
    <MDXEditor
      ref={ref}
      markdown={`${declarations}\n\n<A />`}
      plugins={[
        jsxPlugin({
          jsxComponentDescriptors: [
            { name: '*', kind: 'flow', source: '@fallback', props: [], hasChildren: false, Editor: GenericJsxEditor }
          ]
        })
      ]}
    />
  )
  await waitFor(() => {
    expect(ref.current).not.toBeNull()
  })
  const saved = ref.current!.getMarkdown()
  expect(saved.trim()).toBe(`${expectedImport}\n\n<A />`)
  act(() => {
    ref.current!.setMarkdown(saved)
  })
  await waitFor(() => {
    expect(ref.current!.getMarkdown()).toBe(saved)
  })
})
