import React from 'react'
import { describe, expect, it } from 'vitest'
import { GenericJsxEditor, MDXEditor, MDXEditorMethods, jsxPlugin } from '../'
import { render, act } from '@testing-library/react'
import { JsxComponentDescriptor } from '@/plugins/jsx/utils'

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
  // produces a warning about act
  it.todo('skips jsx import if not specified', async () => {
    const markdown = `
      <Callout />
    `
    const ref = React.createRef<MDXEditorMethods>()
    act(() => {
      render(<MDXEditor ref={ref} plugins={[jsxPlugin({ jsxComponentDescriptors })]} markdown={markdown} />)
    })
    await new Promise((resolve) => setTimeout(resolve, 100))

    const processedMarkdown = ref.current?.getMarkdown().trim()
    expect(processedMarkdown).toEqual(markdown.trim())
  })
})
