import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import React from 'react'
import { MDXEditor, MDXEditorMethods } from '../'

// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

describe('getSelectionMarkdown', () => {
  it('returns empty string when no selection', () => {
    const ref = React.createRef<MDXEditorMethods>()
    render(<MDXEditor ref={ref} markdown="Hello World" />)

    // Without making a selection, should return empty string
    expect(ref.current?.getSelectionMarkdown()).toBe('')
  })

  it('returns empty string for empty markdown', () => {
    const ref = React.createRef<MDXEditorMethods>()
    render(<MDXEditor ref={ref} markdown="" />)

    expect(ref.current?.getSelectionMarkdown()).toBe('')
  })

  it('method exists and is callable', () => {
    const ref = React.createRef<MDXEditorMethods>()
    render(<MDXEditor ref={ref} markdown="Test content" />)

    expect(ref.current?.getSelectionMarkdown).toBeDefined()
    expect(typeof ref.current?.getSelectionMarkdown).toBe('function')
  })

  // Note: Testing actual selections programmatically in Lexical requires
  // more complex setup with editor.update() and selection manipulation.
  // These tests verify the method exists and handles the no-selection case.
  // Manual testing via the Ladle story is recommended for selection scenarios.
})
