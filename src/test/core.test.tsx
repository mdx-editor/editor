import React from 'react'
import { describe, expect, it } from 'vitest'
import { MDXEditor, MDXEditorMethods } from '../'
import { render } from '@testing-library/react'

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

  it('works with italics', () => {
    testIdenticalMarkdown(`*Hello* World`)
  })

  it('works with strong', () => {
    testIdenticalMarkdown(`**Hello** World`)
  })

  it('works with underline', () => {
    testIdenticalMarkdown(`<u>Hello</u> World`)
  })

  it('works with code', () => {
    testIdenticalMarkdown('`Hello` World')
  })
})
