import React from 'react'
import { describe, expect, it } from 'vitest'
import { MDXEditor, MDXEditorMethods } from '../'
import { render } from '@testing-library/react'
import { $getRoot, createEditor, ParagraphNode, TextNode } from 'lexical'
import { QuoteNode } from '@lexical/rich-text'
import { importMarkdownToLexical } from '../importMarkdownToLexical'
import { exportMarkdownFromLexical } from '../exportMarkdownFromLexical'
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
        visitors: [MdastRootVisitor, MdastParagraphVisitor, MdastTextVisitor, MdastBreakVisitor, MdastBlockQuoteVisitor] as any,
        syntaxExtensions: [],
        mdastExtensions: [],
        jsxComponentDescriptors: [],
        directiveDescriptors: [],
        codeBlockEditorDescriptors: []
      })

      exportedMarkdown = exportMarkdownFromLexical({
        root: $getRoot(),
        visitors: [LexicalRootVisitor, LexicalParagraphVisitor, LexicalTextVisitor, LexicalLinebreakVisitor, LexicalQuoteVisitor] as any,
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
})
