import React from 'react'
import { describe, expect, it, test, vi } from 'vitest'
import { codeBlockPlugin, codeMirrorPlugin, linkPlugin, MDXEditor, MDXEditorMethods, thematicBreakPlugin } from '../'
import { render } from '@testing-library/react'
import { $getRoot, createEditor, ParagraphNode, TextNode } from 'lexical'
import { QuoteNode } from '@lexical/rich-text'
import { importMarkdownToLexical, type MarkdownParseOptions, type MdastImportVisitor } from '../importMarkdownToLexical'
import { exportMarkdownFromLexical, type ExportMarkdownFromLexicalOptions } from '../exportMarkdownFromLexical'
import { MdastRootVisitor } from '../plugins/core/MdastRootVisitor'
import { MdastParagraphVisitor } from '../plugins/core/MdastParagraphVisitor'
import { MdastTextVisitor } from '../plugins/core/MdastTextVisitor'
import { MdastBreakVisitor } from '../plugins/core/MdastBreakVisitor'
import { LexicalRootVisitor } from '../plugins/core/LexicalRootVisitor'
import { LexicalParagraphVisitor } from '../plugins/core/LexicalParagraphVisitor'
import { LexicalTextVisitor } from '../plugins/core/LexicalTextVisitor'
import { LexicalLinebreakVisitor } from '../plugins/core/LexicalLinebreakVisitor'
import { MdastBlockQuoteVisitor } from '../plugins/quote/MdastBlockQuoteVisitor'
import { LexicalQuoteVisitor } from '../plugins/quote/LexicalQuoteVisitor'
import { ListItemNode, ListNode } from '@lexical/list'
import { LexicalListItemVisitor } from '../plugins/lists/LexicalListItemVisitor'
import { LexicalListVisitor } from '../plugins/lists/LexicalListVisitor'
import { MdastListItemVisitor } from '../plugins/lists/MdastListItemVisitor'
import { MdastListVisitor } from '../plugins/lists/MdastListVisitor'
import { MdastCodeVisitor } from '../plugins/codeblock/MdastCodeVisitor'
import { CodeBlockVisitor } from '../plugins/codeblock/CodeBlockVisitor'
import { CodeBlockNode } from '../plugins/codeblock/CodeBlockNode'
import { LinkNode } from '@lexical/link'
import type * as Mdast from 'mdast'
import { MdastLinkVisitor } from '../plugins/link/MdastLinkVisitor'
import { IS_ITALIC, IS_UNDERLINE } from '../FormatConstants'

// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

function testIdenticalMarkdown(markdown: string) {
  const ref = React.createRef<MDXEditorMethods>()
  render(<MDXEditor ref={ref} markdown={markdown} />)
  const processedMarkdown = ref.current?.getMarkdown().trim()
  expect(processedMarkdown).toEqual(markdown.trim())
}

describe('markdown import export', () => {
  it('works with an empty string', () => {
    testIdenticalMarkdown('')
  })

  it('works with a simple paragraph', () => {
    testIdenticalMarkdown('Hello World')
  })

  it('works with a line break', () => {
    testIdenticalMarkdown(`Hello\nWorld`)
  })

  it('exports consecutive line breaks as a paragraph break', () => {
    const ref = React.createRef<MDXEditorMethods>()
    render(<MDXEditor ref={ref} markdown={'a\\\n\\\nb'} />)
    expect(ref.current?.getMarkdown().trim()).toEqual('a\n\nb')
  })

  it('keeps leading whitespace of the paragraph that follows consecutive line breaks', () => {
    const ref = React.createRef<MDXEditorMethods>()
    render(<MDXEditor ref={ref} markdown={'a\\\n\\\n&#x20;b'} />)
    expect(ref.current?.getMarkdown().trim()).toEqual('a\n\n&#x20;b')
  })

  it('works with two paragraphs', () => {
    testIdenticalMarkdown(`Hello\n\nWorld`)
  })

  it('works with two whitespaces', () => {
    testIdenticalMarkdown(`Hello\n\nWorld`)
  })

  it('preserves empty lines inside blockquotes across lexical markdown round-trips', () => {
    const mdastVisitors = [
      MdastRootVisitor,
      MdastParagraphVisitor,
      MdastTextVisitor,
      MdastBreakVisitor,
      MdastBlockQuoteVisitor
    ] as unknown as MarkdownParseOptions['visitors']
    const lexicalVisitors = [
      LexicalRootVisitor,
      LexicalParagraphVisitor,
      LexicalTextVisitor,
      LexicalLinebreakVisitor,
      LexicalQuoteVisitor
    ] as unknown as ExportMarkdownFromLexicalOptions['visitors']

    const editor = createEditor({
      namespace: 'test-editor',
      nodes: [ParagraphNode, TextNode, QuoteNode],
      onError(error) {
        throw error
      }
    })

    let exportedMarkdown = ''

    editor.update(() => {
      importMarkdownToLexical({
        root: $getRoot(),
        markdown: `> one
> two
>
> three`,
        visitors: mdastVisitors,
        syntaxExtensions: [],
        mdastExtensions: [],
        jsxComponentDescriptors: [],
        directiveDescriptors: [],
        codeBlockEditorDescriptors: [],
        defaultCodeBlockLanguage: ''
      })

      exportedMarkdown = exportMarkdownFromLexical({
        root: $getRoot(),
        visitors: lexicalVisitors,
        toMarkdownExtensions: [],
        toMarkdownOptions: {},
        jsxComponentDescriptors: [],
        jsxIsAvailable: false
      }).trim()
    })

    expect(exportedMarkdown).toEqual(`> one
> two
>
> three`)
  })

  it('works with italics', () => {
    testIdenticalMarkdown(`*Hello* World`)
  })

  it('works with strong', () => {
    testIdenticalMarkdown(`**Hello** World`)
  })

  it('works with underline', () => {
    testIdenticalMarkdown(`<u>Hello</u> World`)
  })

  it('works with underline', () => {
    testIdenticalMarkdown(`a<u>***Hello***</u>a World`)
  })

  it.each(['***arp*:** Displays tables', '***a* b**', '***a `c`* b**', '~~a **b** c~~', '~~**a** b~~', '==**a** b==', '~~***a*** b~~'])(
    'keeps a format that runs past a nested one intact: %s',
    (markdown) => {
      testIdenticalMarkdown(markdown)
    }
  )

  it('works with code', () => {
    testIdenticalMarkdown('`Hello` World')
  })
  it('works with code in strong', () => {
    testIdenticalMarkdown('**`Hello` World**')
  })

  it.each([
    ['**[a](https://x.com)**', '[**a**](https://x.com)'],
    ['~~[a](https://x.com)~~', '[~~a~~](https://x.com)'],
    ['<u>[a](https://x.com)</u>', '[<u>a</u>](https://x.com)'],
    ['**<kbd>a</kbd> b**', '<kbd>**a**</kbd> **b**'],
    ['**<span style="color: red">a</span> b**', '<span style="color: red">**a**</span> **b**'],
    ['<span style="color: red">**a** b</span>', '<span style="color: red">**a** b</span>']
  ])('keeps the surrounding formatting of text inside inline elements: %s', (markdown, expected) => {
    const ref = React.createRef<MDXEditorMethods>()
    render(<MDXEditor ref={ref} markdown={markdown} plugins={[linkPlugin()]} />)
    expect(ref.current?.getMarkdown().trim()).toEqual(expected)
  })

  it('keeps formatting that a custom import visitor assigns to a child node', () => {
    const UnderlineLinksInEmphasisVisitor: MdastImportVisitor<Mdast.Emphasis> = {
      testNode: 'emphasis',
      visitNode({ mdastNode, actions, lexicalParent }) {
        actions.addFormatting(IS_ITALIC)
        mdastNode.children.forEach((child) => {
          if (child.type === 'link') {
            actions.addFormatting(IS_UNDERLINE, child)
          }
        })
        actions.visitChildren(mdastNode, lexicalParent)
      }
    }

    const editor = createEditor({
      namespace: 'test-editor',
      nodes: [ParagraphNode, TextNode, LinkNode],
      onError(error) {
        throw error
      }
    })

    let linkTextFormat = 0
    editor.update(() => {
      importMarkdownToLexical({
        root: $getRoot(),
        markdown: '*[a](https://x.com)*',
        visitors: [
          MdastRootVisitor,
          MdastParagraphVisitor,
          MdastTextVisitor,
          MdastLinkVisitor,
          UnderlineLinksInEmphasisVisitor
        ] as unknown as MarkdownParseOptions['visitors'],
        syntaxExtensions: [],
        mdastExtensions: [],
        jsxComponentDescriptors: [],
        directiveDescriptors: [],
        codeBlockEditorDescriptors: [],
        defaultCodeBlockLanguage: ''
      })
      linkTextFormat = $getRoot().getAllTextNodes()[0].getFormat()
    })

    expect(linkTextFormat).toBe(IS_UNDERLINE)
  })

  it('preserves fenced code block metadata when CodeMirror handles a configured language', () => {
    const ref = React.createRef<MDXEditorMethods>()
    const markdown = `
\`\`\`tsx live react
export default function App() {
  return <h1>Hello world</h1>
}
\`\`\`
`.trim()

    render(
      <MDXEditor
        ref={ref}
        markdown={markdown}
        plugins={[codeBlockPlugin(), codeMirrorPlugin({ codeBlockLanguages: { tsx: 'TypeScript (React)' } })]}
      />
    )

    expect(ref.current?.getMarkdown().trim()).toEqual(markdown)
  })

  it('falls back to the default code block language for unsupported languages with metadata', () => {
    const ref = React.createRef<MDXEditorMethods>()
    const onError = vi.fn()
    const markdown = `
Before fence.

\`\`\`unsupported live
some content
\`\`\`

After fence.
`.trim()

    render(
      <MDXEditor
        ref={ref}
        markdown={markdown}
        onError={onError}
        plugins={[codeBlockPlugin({ defaultCodeBlockLanguage: 'txt' }), codeMirrorPlugin({ codeBlockLanguages: { txt: 'Plain text' } })]}
      />
    )

    expect(onError).not.toHaveBeenCalled()
    const html = ref.current?.getContentEditableHTML() ?? ''
    expect(html).toContain('some content')
    expect(html).toContain('After fence.')
    expect(ref.current?.getMarkdown().trim()).toEqual(markdown)
  })

  it('imports valid and malformed code block JSON without leaking invalid custom fields', () => {
    const editor = createEditor({
      namespace: 'code-block-json-test',
      nodes: [CodeBlockNode],
      onError(error) {
        throw error
      }
    })

    editor.update(
      () => {
        const serializedNodes = [
          CodeBlockNode.importJSON({
            type: 'codeblock',
            version: 1,
            code: 'const valid = true',
            language: 'ts',
            meta: 'live'
          }),
          CodeBlockNode.importJSON({ type: 'codeblock', version: 1 }),
          CodeBlockNode.importJSON({ type: 'codeblock', version: 1, code: 42, language: null, meta: false })
        ]
        expect(serializedNodes.map((node) => node.exportJSON())).toEqual([
          { type: 'codeblock', version: 1, code: 'const valid = true', language: 'ts', meta: 'live' },
          { type: 'codeblock', version: 1, code: '', language: '', meta: '' },
          { type: 'codeblock', version: 1, code: '', language: '', meta: '' }
        ])
      },
      { discrete: true }
    )
  })

  it('round-trips thematic breaks through the retained React node path', () => {
    const ref = React.createRef<MDXEditorMethods>()
    render(<MDXEditor ref={ref} markdown={'Before\n\n***\n\nAfter'} plugins={[thematicBreakPlugin()]} />)

    expect(ref.current?.getMarkdown().trim()).toEqual('Before\n\n***\n\nAfter')
  })
})

describe('List parsing and serialization', () => {
  const parseAndExport = (markdown: string) => {
    const mdastVisitors = [
      MdastRootVisitor,
      MdastParagraphVisitor,
      MdastTextVisitor,
      MdastBreakVisitor,
      MdastListVisitor,
      MdastListItemVisitor,
      MdastCodeVisitor
    ] as unknown as MarkdownParseOptions['visitors']
    const lexicalVisitors = [
      LexicalRootVisitor,
      LexicalParagraphVisitor,
      LexicalTextVisitor,
      LexicalLinebreakVisitor,
      LexicalListVisitor,
      LexicalListItemVisitor,
      CodeBlockVisitor
    ] as unknown as ExportMarkdownFromLexicalOptions['visitors']

    const editor = createEditor({
      namespace: 'test-editor',
      nodes: [ParagraphNode, TextNode, ListItemNode, ListNode, CodeBlockNode],
      onError(error) {
        throw error
      }
    })

    let exportedMarkdown = ''

    editor.update(() => {
      importMarkdownToLexical({
        root: $getRoot(),
        markdown,
        visitors: mdastVisitors,
        syntaxExtensions: [],
        mdastExtensions: [],
        jsxComponentDescriptors: [],
        directiveDescriptors: [],
        codeBlockEditorDescriptors: [{ match: () => true, priority: 0, Editor: () => null }],
        defaultCodeBlockLanguage: ''
      })

      exportedMarkdown = exportMarkdownFromLexical({
        root: $getRoot(),
        visitors: lexicalVisitors,
        toMarkdownExtensions: [],
        toMarkdownOptions: {},
        jsxComponentDescriptors: [],
        jsxIsAvailable: false
      }).trim()
    })

    return exportedMarkdown
  }

  test('preserves empty lines inside unordered lists', () => {
    const markdown = `* This is the first list item.
* Here's the second list item.

  I need to add another paragraph below the second list item.

  And another one.
* And here's the third list item.`

    const exportedMarkdown = parseAndExport(markdown)
    expect(exportedMarkdown).toEqual(markdown)
  })

  test('preserves empty lines inside ordered lists', () => {
    const markdown = `1. This is the first list item.
2. Here's the second list item.

   I need to add another paragraph below the second list item.

   And another one.
3. And here's the third list item.`

    const exportedMarkdown = parseAndExport(markdown)
    expect(exportedMarkdown).toEqual(markdown)
  })

  test('does not insert extra blank lines before paragraphs that follow list item code blocks', () => {
    const markdown = `* This is the first list item.
* Here's the second list item.
  \`\`\`txt
  code
  \`\`\`
  I need to add another paragraph below the code block.
* And here's the third list item.`

    const exportedMarkdown = parseAndExport(markdown)
    expect(exportedMarkdown).toEqual(markdown)
  })
})
