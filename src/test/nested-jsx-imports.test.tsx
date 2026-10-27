import { describe, expect, it } from 'vitest'
import { $getRoot, createEditor, type LexicalNode } from 'lexical'
import type * as Mdast from 'mdast'
import type { ContainerDirective } from 'mdast-util-directive'
import type { MdxJsxFlowElement } from 'mdast-util-mdx-jsx'
import { exportLexicalTreeToMdast, type ExportLexicalTreeOptions } from '../exportMarkdownFromLexical'
import { $createDirectiveNode, DirectiveNode } from '../plugins/directives/DirectiveNode'
import { DirectiveVisitor } from '../plugins/directives/DirectiveVisitor'
import { LexicalRootVisitor } from '../plugins/core/LexicalRootVisitor'
import { $createLexicalJsxNode, LexicalJsxNode } from '../plugins/jsx/LexicalJsxNode'
import { LexicalJsxVisitor } from '../plugins/jsx/LexicalJsxVisitor'
import type { JsxComponentDescriptor } from '../plugins/jsx'
import { $createTableNode, TableNode } from '../plugins/table/TableNode'
import { LexicalTableVisitor } from '../plugins/table/LexicalTableVisitor'
import { fromMarkdown } from 'mdast-util-from-markdown'
import { mdxFromMarkdown } from 'mdast-util-mdx'
import { mdxjs } from 'micromark-extension-mdxjs'
import { createImportDeclaration } from '../plugins/jsx/imports'

function jsx(name: string | null, children: Mdast.BlockContent[] = []): MdxJsxFlowElement {
  return { type: 'mdxJsxFlowElement', name, attributes: [], children }
}

function descriptor(name: string, source?: string, defaultExport = false): JsxComponentDescriptor {
  return { name, kind: 'flow', source, defaultExport, props: [], hasChildren: false, Editor: () => null }
}

function admonition(children: Mdast.RootContent[]) {
  return $createDirectiveNode({
    type: 'containerDirective',
    name: 'tip',
    attributes: {},
    children: children as ContainerDirective['children']
  })
}

function exportNodes(createNodes: () => LexicalNode[], descriptors: JsxComponentDescriptor[], addImportStatements = true) {
  const editor = createEditor({
    nodes: [DirectiveNode, LexicalJsxNode, TableNode],
    onError: (error) => {
      throw error
    }
  })
  let result!: Mdast.Root
  editor.update(
    () => {
      const root = $getRoot()
      root.append(...createNodes())
      result = exportLexicalTreeToMdast({
        root,
        visitors: [
          LexicalRootVisitor,
          DirectiveVisitor,
          LexicalJsxVisitor,
          LexicalTableVisitor
        ] as unknown as ExportLexicalTreeOptions['visitors'],
        jsxComponentDescriptors: descriptors,
        jsxIsAvailable: true,
        addImportStatements
      })
    },
    { discrete: true }
  )
  return result
}

function importValues(root: Mdast.Root) {
  return root.children.filter((node) => node.type === 'mdxjsEsm').map((node) => node.value)
}

function parsedMdx(markdown: string) {
  return fromMarkdown(markdown, { extensions: [mdxjs()], mdastExtensions: [mdxFromMarkdown()] }).children
}

describe('imports from nested MDAST subtrees', () => {
  it('imports components shared by root, directives and tables only once', () => {
    const result = exportNodes(
      () => [
        $createLexicalJsxNode(jsx('Default')),
        admonition([jsx('Default'), jsx('First'), jsx('Second')]),
        $createTableNode({
          type: 'table',
          children: [
            {
              type: 'tableRow',
              children: [{ type: 'tableCell', children: [{ ...jsx('First'), type: 'mdxJsxTextElement', children: [] }] }]
            }
          ]
        })
      ],
      [descriptor('Default', '@default', true), descriptor('First', '@components'), descriptor('Second', '@components')]
    )
    expect(importValues(result)).toEqual(["import { First, Second } from '@components'", "import Default from '@default'"])
  })

  it('does not duplicate parsed directive-local default, aliased or namespace bindings', () => {
    const children = parsedMdx(
      "import Existing from '@existing'\nimport { Original as Alias } from '@alias'\nimport * as UI from '@ui'\n\n<Existing />\n\n<Alias />\n\n<UI.Badge />"
    )
    const result = exportNodes(
      () => [$createLexicalJsxNode(jsx('Existing')), admonition([...children, jsx('Fresh')])],
      [descriptor('*', '@fallback')]
    )
    expect(importValues(result)).toEqual(["import { Fresh } from '@fallback'"])
    expect(result.children.at(-1)).toMatchObject({ children: [...children, jsx('Fresh')] })
  })

  it('keeps reconstructed directive-local import ownership without reparsing ESM', () => {
    const existingImport = createImportDeclaration([
      {
        source: '@original',
        defaultExport: false,
        kind: 'named',
        importedName: 'Original',
        localName: 'Alias'
      }
    ])
    const result = exportNodes(() => [admonition([existingImport, jsx('Alias')])], [descriptor('*', '@fallback')])
    expect(importValues(result)).toEqual([])
    expect(result.children[0]).toMatchObject({ children: [existingImport, jsx('Alias')] })
  })

  it.each([true, false])('exports Lexical fragments and their children (addImportStatements: %s)', (addImportStatements) => {
    const fragment = jsx(null, [jsx('Fresh'), jsx(null, [jsx('Other')])])
    const result = exportNodes(() => [$createLexicalJsxNode(fragment)], [descriptor('*', '@components')], addImportStatements)
    expect(importValues(result)).toEqual(addImportStatements ? ["import { Fresh, Other } from '@components'"] : [])
    expect(result.children.at(-1)).toEqual(fragment)
    expect(importValues(exportNodes(() => [$createLexicalJsxNode(jsx(null))], []))).toEqual([])
  })

  it('uses exact descriptors before wildcard sources and skips source-less descriptors', () => {
    const result = exportNodes(
      () => [admonition([jsx('Exact'), jsx('Fallback'), jsx('NoImport')])],
      [descriptor('*', '@fallback'), descriptor('Exact', '@exact', true), descriptor('NoImport')]
    )
    expect(importValues(result)).toEqual(["import { Fallback } from '@fallback'", "import Exact from '@exact'"])
    expect(importValues(exportNodes(() => [admonition([jsx('Unknown')])], []))).toEqual([])
  })

  it('does not generate fresh imports during a nested-editor export, but retains legacy import metadata', () => {
    const result = exportNodes(
      () => [$createLexicalJsxNode(jsx('Existing'), { source: '@existing', defaultExport: true }), admonition([jsx('Fresh')])],
      [descriptor('*'), descriptor('Fresh', '@fresh')],
      false
    )
    expect(importValues(result)).toEqual(["import Existing from '@existing'"])
  })

  it('uses a Unicode-aware identifier guard in root, JSX-child, directive and table paths', () => {
    const invalid = ['UI.Badge', 'my-element', 'svg', 'foo', 'img']
    const valid = ['Äpfel', 'A\u0308pfel']
    const names = [...valid, ...invalid]
    const placements: (() => LexicalNode[])[] = [
      () => names.map((name) => $createLexicalJsxNode(jsx(name))),
      () => [
        $createLexicalJsxNode(
          jsx(
            null,
            names.map((name) => jsx(name))
          )
        )
      ],
      () => [admonition(names.map((name) => jsx(name)))],
      () => [
        $createTableNode({
          type: 'table',
          children: [
            {
              type: 'tableRow',
              children: [
                { type: 'tableCell', children: names.map((name) => ({ ...jsx(name), type: 'mdxJsxTextElement' as const, children: [] })) }
              ]
            }
          ]
        })
      ]
    ]
    for (const createNodes of placements) {
      expect(importValues(exportNodes(createNodes, [descriptor('*', '@components')]))).toEqual([
        "import { Äpfel, A\u0308pfel } from '@components'"
      ])
    }
  })
})
