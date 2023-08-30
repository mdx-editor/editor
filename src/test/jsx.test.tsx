import React from 'react'
import { describe, expect, it } from 'vitest'
import { GenericJsxEditor, JsxComponentDescriptor, MDXEditor, MDXEditorMethods, jsxPlugin } from '../'
import { render } from '@testing-library/react'

// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

const jsxComponentDescriptors: JsxComponentDescriptor[] = [
  {
    name: 'Callout',
    kind: 'text',
    props: [
      { name: 'foo', type: 'string' },
      { name: 'bar', type: 'string' }
    ],
    hasChildren: false,
    Editor: GenericJsxEditor
  }
]
describe('jsx markdown import export', () => {
  it('skips jsx import if not specified', () => {
    const markdown = `
      <Callout />
    `
    const ref = React.createRef<MDXEditorMethods>()
    render(<MDXEditor ref={ref} plugins={[jsxPlugin({ jsxComponentDescriptors })]} markdown={markdown} />)
    const processedMarkdown = ref.current?.getMarkdown().trim()
    expect(processedMarkdown).toEqual(markdown.trim())
  })
})
