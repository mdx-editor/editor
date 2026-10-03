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

describe('imports from nested MDAST subtrees', () => {
  it('imports a default JSX component inside an admonition at the document root', () => {
    const result = exportNodes(() => [admonition([jsx('Zazz')])], [descriptor('Zazz', '@zazz', true)])
    expect(importValues(result)).toEqual(["import Zazz from '@zazz'"])
  })

  it('groups named imports and keeps default imports separate', () => {
    const result = exportNodes(
      () => [admonition([jsx('First'), jsx('Second'), jsx('Default')])],
      [descriptor('First', '@components'), descriptor('Second', '@components'), descriptor('Default', '@default', true)]
    )
    expect(importValues(result)).toEqual(["import { First, Second } from '@components'", "import Default from '@default'"])
  })

  it('deduplicates references shared by the root and multiple nested editors', () => {
    const result = exportNodes(
      () => [$createLexicalJsxNode(jsx('Zazz')), admonition([jsx('Zazz'), jsx('Zazz')]), admonition([jsx('Zazz')])],
      [descriptor('Zazz', '@zazz', true)]
    )
    expect(importValues(result)).toEqual(["import Zazz from '@zazz'"])
  })

  it('finds JSX references inside table cells', () => {
    const result = exportNodes(
      () => [
        $createTableNode({
          type: 'table',
          children: [
            {
              type: 'tableRow',
              children: [{ type: 'tableCell', children: [{ ...jsx('Badge'), type: 'mdxJsxTextElement', children: [] }] }]
            }
          ]
        })
      ],
      [descriptor('Badge', '@components')]
    )
    expect(importValues(result)).toEqual(["import { Badge } from '@components'"])
  })

  it('does not import HTML elements or fragments, but visits their component children', () => {
    const result = exportNodes(() => [admonition([jsx(null, [jsx('span', [jsx('Section')])])])], [descriptor('*', '@components')])
    expect(importValues(result)).toEqual(["import { Section } from '@components'"])
  })

  it('does not invent imports for unknown components', () => {
    const result = exportNodes(() => [admonition([jsx('Unknown')])], [])
    expect(importValues(result)).toEqual([])
  })

  it('uses wildcard descriptor sources only when there is no exact descriptor', () => {
    const result = exportNodes(
      () => [admonition([jsx('Exact'), jsx('Fallback'), jsx('NoImport')])],
      [descriptor('*', '@fallback'), descriptor('Exact', '@exact', true), descriptor('NoImport')]
    )
    expect(importValues(result)).toEqual(["import { Fallback } from '@fallback'", "import Exact from '@exact'"])
  })

  it('does not add imports for a source-less wildcard descriptor', () => {
    const result = exportNodes(() => [admonition([jsx('Unknown')])], [descriptor('*')])
    expect(importValues(result)).toEqual([])
  })

  it('keeps existing nested imports in place, as required by #734', () => {
    const existingImport = { type: 'mdxjsEsm' as const, value: "import Existing from '@existing'" }
    const result = exportNodes(
      () => [admonition([existingImport, jsx('Existing'), jsx('Zazz')])],
      [descriptor('*'), descriptor('Zazz', '@zazz', true)]
    )
    expect(importValues(result)).toEqual(["import Zazz from '@zazz'"])
    expect(result.children[1]).toMatchObject({ type: 'containerDirective', children: [existingImport, jsx('Existing'), jsx('Zazz')] })
  })

  it('does not generate fresh imports during a nested-editor export', () => {
    const result = exportNodes(() => [admonition([jsx('Zazz')])], [descriptor('Zazz', '@zazz', true)], false)
    expect(importValues(result)).toEqual([])
  })

  it('preserves the original JSX import source when nested export suppresses new imports', () => {
    const result = exportNodes(
      () => [$createLexicalJsxNode(jsx('Existing'), { source: '@existing', defaultExport: true })],
      [descriptor('*')],
      false
    )
    expect(importValues(result)).toEqual(["import Existing from '@existing'"])
  })
})
