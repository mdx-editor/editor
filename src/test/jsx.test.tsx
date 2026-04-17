import React from 'react'
import { describe, expect, it } from 'vitest'
import { GenericJsxEditor, JsxComponentDescriptor, MDXEditor, MDXEditorMethods, jsxPlugin } from '../'
import { render, act } from '@testing-library/react'

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

  it('routes capitalized jsx components sharing an html tag name to the jsx visitor', () => {
    const descriptors: JsxComponentDescriptor[] = [
      {
        name: 'Section',
        kind: 'text',
        props: [],
        hasChildren: true,
        Editor: GenericJsxEditor
      }
    ]
    const { container } = render(
      <MDXEditor markdown={`<Section>Section content</Section>`} plugins={[jsxPlugin({ jsxComponentDescriptors: descriptors })]} />
    )
    expect(container.querySelector('section')).toBeNull()
  })

  it('keeps lowercase html tag names on the html path even with a jsx plugin', () => {
    const { container } = render(
      <MDXEditor markdown={`<section>Section content</section>`} plugins={[jsxPlugin({ jsxComponentDescriptors: [] })]} />
    )
    expect(container.querySelector('section')).not.toBeNull()
  })
})
