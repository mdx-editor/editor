import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MDXEditor, MDXEditorMethods } from '../MDXEditor'
import { frontmatterPlugin, frontmatterDialogOpen$ } from '../plugins/frontmatter'
import { rootEditor$ } from '../plugins/core'
import { UNDO_COMMAND, REDO_COMMAND } from 'lexical'
import { toolbarPlugin } from '../plugins/toolbar'
import { usePublisher, useCellValues } from '@mdxeditor/gurx'

function Open() {
  const open = usePublisher(frontmatterDialogOpen$)
  const [editor] = useCellValues(rootEditor$)
  return (
    <>
      <button
        onClick={() => {
          open(true)
        }}
      >
        Open frontmatter
      </button>
      <button onClick={() => editor?.dispatchCommand(UNDO_COMMAND, undefined)}>Undo</button>
      <button onClick={() => editor?.dispatchCommand(REDO_COMMAND, undefined)}>Redo</button>
    </>
  )
}
function Harness({
  yaml = 'title: original\ncover:\n  src: /old.png\nflag: false\ncount: 0',
  readOnly = false
}: {
  yaml?: string
  readOnly?: boolean
}) {
  const ref = React.useRef<MDXEditorMethods>(null)
  const [markdown, setMarkdown] = React.useState('')
  return (
    <>
      <MDXEditor
        ref={ref}
        markdown={`---\n${yaml}\n---\n\nBody`}
        readOnly={readOnly}
        plugins={[
          frontmatterPlugin(),
          toolbarPlugin({
            toolbarContents: () => (
              <>
                <Open />
              </>
            )
          })
        ]}
      />
      <button
        onClick={() => {
          setMarkdown(ref.current!.getMarkdown())
        }}
      >
        Read markdown
      </button>
      <output aria-label="Markdown">{markdown}</output>
    </>
  )
}
function read() {
  fireEvent.click(screen.getByText('Read markdown'))
  return screen.getByLabelText('Markdown').textContent!
}

describe('structured frontmatter dialog', () => {
  it('edits nested strings and booleans while preserving zero and other fields', async () => {
    render(<Harness />)
    fireEvent.click(screen.getByText('Open frontmatter'))
    fireEvent.change(screen.getByLabelText('Frontmatter[2][1] value'), { target: { value: '/new.png' } })
    fireEvent.click(screen.getByLabelText('Frontmatter[3] value'))
    fireEvent.click(screen.getByText('Save'))
    await waitFor(() => {
      expect(read()).toContain('/new.png')
    })
    expect(read()).toContain('flag: true')
    expect(read()).toContain('count: 0')
    expect(read()).toContain('title: original')
  })
  it('discards edits on cancel and reloads current YAML on reopen', () => {
    render(<Harness />)
    fireEvent.click(screen.getByText('Open frontmatter'))
    fireEvent.change(screen.getByLabelText('Frontmatter[1] value'), { target: { value: 'discard' } })
    fireEvent.click(screen.getAllByRole('button', { name: 'Cancel' })[0])
    expect(read()).toContain('title: original')
    fireEvent.click(screen.getByText('Open frontmatter'))
    expect(screen.getByLabelText('Frontmatter[1] value')).toHaveValue('original')
  })
  it('renders malformed YAML safely and lets the user repair it', async () => {
    render(<Harness yaml="cover: [" />)
    fireEvent.click(screen.getByText('Open frontmatter'))
    expect(screen.getByRole('alert')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('YAML'), { target: { value: 'cover: [fixed]' } })
    fireEvent.click(screen.getByText('Save'))
    await waitFor(() => {
      expect(read()).toContain('cover: [fixed]')
    })
  })
  it('prevents save and removal in read-only mode', () => {
    render(<Harness readOnly />)
    fireEvent.click(screen.getByText('Open frontmatter'))
    expect(screen.getByText('Save')).toBeDisabled()
    expect(screen.getByText('Remove frontmatter')).toBeDisabled()
    expect(screen.getByLabelText('Frontmatter[1] value')).toBeDisabled()
  })
  it('undoes and redoes a save as one transaction', async () => {
    render(<Harness />)
    fireEvent.click(screen.getByText('Open frontmatter'))
    fireEvent.change(screen.getByLabelText('Frontmatter[1] value'), { target: { value: 'changed' } })
    fireEvent.change(screen.getByLabelText('Frontmatter[2][1] value'), { target: { value: '/changed.png' } })
    fireEvent.click(screen.getByText('Save'))
    await waitFor(() => {
      expect(read()).toContain('/changed.png')
    })
    const undo = screen.getByRole('button', { name: /Undo/ })
    await waitFor(() => {
      expect(undo).not.toBeDisabled()
    })
    fireEvent.click(undo)
    await waitFor(() => {
      expect(read()).toContain('title: original')
    })
    expect(read()).toContain('/old.png')
    fireEvent.click(screen.getByRole('button', { name: /Redo/ }))
    await waitFor(() => {
      expect(read()).toContain('/changed.png')
    })
  })
  it('keeps invalid edits open instead of overwriting the document', () => {
    render(<Harness />)
    fireEvent.click(screen.getByText('Open frontmatter'))
    fireEvent.change(screen.getByLabelText('Frontmatter[4] value'), { target: { value: '-' } })
    fireEvent.click(screen.getByText('Save'))
    expect(screen.getByRole('alert')).toHaveTextContent('finite number')
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })
  it('edits heterogeneous arrays and keeps empty strings and nulls', async () => {
    render(<Harness yaml="items: [false, 0, null, '']" />)
    fireEvent.click(screen.getByText('Open frontmatter'))
    fireEvent.click(screen.getByLabelText('Frontmatter[1][1] value'))
    fireEvent.change(screen.getByLabelText('Frontmatter[1][2] value'), { target: { value: '12' } })
    fireEvent.click(screen.getByText('Save'))
    await waitFor(() => {
      expect(read()).toContain('- 12')
    })
    expect(read()).toContain('- true')
    expect(read()).toContain('- null')
    expect(read()).toContain("- ''")
  })
  it('undoes removal even before focusing the document', async () => {
    render(<Harness />)
    fireEvent.click(screen.getByText('Open frontmatter'))
    fireEvent.click(screen.getByText('Remove frontmatter'))
    await waitFor(() => {
      expect(read()).not.toContain('title:')
    })
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }))
    await waitFor(() => {
      expect(read()).toContain('title: original')
    })
  })
  it('does not rewrite YAML when saving without edits', () => {
    const yaml = "# keep comment\ntitle: 'original'"
    render(<Harness yaml={yaml} />)
    fireEvent.click(screen.getByText('Open frontmatter'))
    fireEvent.click(screen.getByText('Save'))
    expect(read()).toContain(yaml)
  })
})

it('preserves large integer source while editing unrelated YAML fields', async () => {
  const yaml = 'title: original\nid: 9223372036854775807'
  render(<Harness yaml={yaml} />)
  fireEvent.click(screen.getByText('Open frontmatter'))
  expect(screen.getByRole('alert')).toHaveTextContent('safe integer')
  expect(screen.getByLabelText('YAML')).toHaveValue(yaml)
  fireEvent.change(screen.getByLabelText('YAML'), { target: { value: yaml.replace('original', 'changed') } })
  fireEvent.click(screen.getByText('Save'))
  await waitFor(() => {
    expect(read()).toContain('title: changed')
  })
  expect(read()).toContain('id: 9223372036854775807')
  fireEvent.click(screen.getByText('Open frontmatter'))
  expect(screen.getByLabelText('YAML')).toHaveValue(yaml.replace('original', 'changed'))
})

it('does not commit a numeric edit outside the safe integer range', () => {
  render(<Harness />)
  fireEvent.click(screen.getByText('Open frontmatter'))
  fireEvent.change(screen.getByLabelText('Frontmatter[4] value'), { target: { value: '9223372036854775807' } })
  fireEvent.click(screen.getByText('Save'))
  expect(screen.getByRole('alert')).toHaveTextContent('safe integer')
  expect(screen.getByRole('dialog')).toBeInTheDocument()
  expect(read()).toContain('count: 0')
})
