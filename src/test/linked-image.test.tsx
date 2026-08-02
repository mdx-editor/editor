import React from 'react'
import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { MDXEditor, MDXEditorMethods, imagePlugin, linkPlugin } from '../'

// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

function roundTrip(markdown: string) {
  const ref = React.createRef<MDXEditorMethods>()
  render(<MDXEditor ref={ref} markdown={markdown} plugins={[linkPlugin(), imagePlugin()]} />)
  return ref.current?.getMarkdown().trim()
}

describe('linked images', () => {
  it('round-trips an image wrapped in a link', () => {
    const md = '[![alt text](https://example.com/img.png "the title")](https://example.com)'
    expect(roundTrip(md)).toEqual(md)
  })

  it('round-trips a plain image', () => {
    const md = '![alt text](https://example.com/img.png)'
    expect(roundTrip(md)).toEqual(md)
  })
})
