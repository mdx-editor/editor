import React from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { GenericJsxEditor, JsxComponentDescriptor, MDXEditor, MDXEditorMethods, jsxPlugin } from '../'
import { render, act, waitFor } from '@testing-library/react'

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

afterEach(() => {
  vi.restoreAllMocks()
})

const flushEditorUpdates = async () => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0))
  })
}

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

  it('routes capitalized jsx components sharing an html tag name to the jsx visitor', async () => {
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
    await flushEditorUpdates()
    expect(container.querySelector('section')).toBeNull()
  })

  it('keeps lowercase html tag names on the html path even with a jsx plugin', () => {
    const { container } = render(
      <MDXEditor markdown={`<section>Section content</section>`} plugins={[jsxPlugin({ jsxComponentDescriptors: [] })]} />
    )
    expect(container.querySelector('section')).not.toBeNull()
  })

  it('registers nested capitalized JSX children that share an html tag name on export', async () => {
    const ref = React.createRef<MDXEditorMethods>()
    const descriptors: JsxComponentDescriptor[] = [
      {
        name: 'Wrapper',
        kind: 'text',
        source: './components',
        props: [],
        hasChildren: true,
        Editor: GenericJsxEditor
      },
      {
        name: 'Section',
        kind: 'text',
        source: './components',
        props: [],
        hasChildren: false,
        Editor: GenericJsxEditor
      }
    ]

    act(() => {
      render(
        <MDXEditor ref={ref} markdown={`<Wrapper><Section /></Wrapper>`} plugins={[jsxPlugin({ jsxComponentDescriptors: descriptors })]} />
      )
    })
    await waitFor(() => {
      expect(ref.current?.getMarkdown() ?? '').toContain(`import { Wrapper, Section } from './components'`)
    })

    const processedMarkdown = ref.current?.getMarkdown() ?? ''

    expect(processedMarkdown).toContain(`import { Wrapper, Section } from './components'`)
    expect(processedMarkdown).toContain(`<Wrapper><Section /></Wrapper>`)
  })
})
