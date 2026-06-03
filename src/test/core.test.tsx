import React from 'react'
import { describe, expect, it, test, vi } from 'vitest'
import { codeBlockPlugin, codeMirrorPlugin, MDXEditor, MDXEditorMethods } from '../'
import { render } from '@testing-library/react'
import { $getRoot, createEditor, ParagraphNode, TextNode } from 'lexical'
import { QuoteNode } from '@lexical/rich-text'
import { importMarkdownToLexical, type MarkdownParseOptions } from '../importMarkdownToLexical'
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

  it('works with code', () => {
    testIdenticalMarkdown('`Hello` World')
  })
  it('works with code in strong', () => {
    testIdenticalMarkdown('**`Hello` World**')
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
})

describe('List parsing and serialization', () => {
  const parseAndExport = (markdown: string) => {
    const mdastVisitors = [
      MdastRootVisitor,
      MdastParagraphVisitor,
      MdastTextVisitor,
      MdastBreakVisitor,
      MdastListVisitor,
      MdastListItemVisitor
    ] as unknown as MarkdownParseOptions['visitors']
    const lexicalVisitors = [
      LexicalRootVisitor,
      LexicalParagraphVisitor,
      LexicalTextVisitor,
      LexicalLinebreakVisitor,
      LexicalListVisitor,
      LexicalListItemVisitor
    ] as unknown as ExportMarkdownFromLexicalOptions['visitors']

    const editor = createEditor({
      namespace: 'test-editor',
      nodes: [ParagraphNode, TextNode, ListItemNode, ListNode],
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
})
