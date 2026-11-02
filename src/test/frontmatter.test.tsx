import React from 'react'
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import YamlParser from 'js-yaml'
import { usePublisher } from '@mdxeditor/gurx'
import { MDXEditor, MDXEditorMethods } from '../MDXEditor'
import { FrontmatterEditorProps, frontmatterDialogOpen$, frontmatterPlugin } from '../plugins/frontmatter'
import { toolbarPlugin } from '../plugins/toolbar'

function OpenFrontmatter() {
  const open = usePublisher(frontmatterDialogOpen$)
  return (
    <button
      onClick={() => {
        open(true)
      }}
    >
      Open frontmatter
    </button>
  )
}

function setup(yaml: string, props: Partial<React.ComponentProps<typeof MDXEditor>> = {}) {
  const ref = React.createRef<MDXEditorMethods>()
  const onChange = vi.fn()
  const editorProps = {
    markdown: `---\n${yaml}\n---\n\nBody`,
    plugins: [frontmatterPlugin(), toolbarPlugin({ toolbarContents: () => <OpenFrontmatter /> })],
    onChange,
    ...props
  }
  const view = render(<MDXEditor ref={ref} {...editorProps} />)
  return {
    ...view,
    ref,
    onChange,
    markdown: () => ref.current!.getMarkdown(),
    rerenderEditor: (nextProps: Partial<React.ComponentProps<typeof MDXEditor>>) => {
      view.rerender(<MDXEditor ref={ref} {...editorProps} {...nextProps} />)
    }
  }
}

function open() {
  fireEvent.click(screen.getByRole('button', { name: 'Open frontmatter' }))
  return screen.getByRole('dialog')
}

function valueField(key: string) {
  const row = screen
    .getAllByRole('textbox', { name: 'Key' })
    .find((input) => (input as HTMLInputElement).value === key)!
    .closest('tr')!
  return within(row).getByRole('textbox', { name: 'Value' })
}

async function save() {
  fireEvent.click(screen.getByRole('button', { name: 'Save' }))
  await waitFor(() => {
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
}

function parse(markdown: string) {
  return YamlParser.load(markdown.split('---')[1], { schema: YamlParser.CORE_SCHEMA })
}

describe('default frontmatter key-value form', () => {
  it('preserves falsy values, date strings and structured fields while editing another field', async () => {
    const yaml =
      'title: original\nflag: false\ncount: 0\nempty: ""\nnothing: null\ndate: 2026-10-27\ncover: {src: /old.png}\nitems: [false, 0]'
    const editor = setup(yaml)
    const dialog = open()
    expect(within(dialog).getByRole('table')).toBeInTheDocument()
    expect(within(dialog).queryByRole('combobox')).not.toBeInTheDocument()
    expect(dialog.querySelector('textarea')).toBeNull()
    expect(valueField('cover')).toHaveAttribute('readonly')
    fireEvent.change(valueField('title'), { target: { value: 'changed' } })
    await save()
    expect(parse(editor.markdown())).toEqual({
      title: 'changed',
      flag: false,
      count: 0,
      empty: '',
      nothing: null,
      date: '2026-10-27',
      cover: { src: '/old.png' },
      items: [false, 0]
    })
    expect(editor.markdown()).not.toContain('T00:00:00')
  })

  it.each([
    '# keep this comment\ntitle: \'original\'\nflag: false\ncount: 0\nempty: ""',
    '{}',
    'cover: {src: /old.png}\nitems: [false, 0]',
    '# preserve anchors too\ncover: &cover {src: /old.png}\ncopy: *cover'
  ])('skips the write on an unchanged save: %s', async (yaml) => {
    const editor = setup(yaml)
    const before = editor.markdown()
    open()
    editor.onChange.mockClear()
    await save()
    expect(editor.markdown()).toBe(before)
    expect(editor.onChange).not.toHaveBeenCalled()
  })

  it('keeps original bytes after editing then reverting string, false, zero and empty fields', async () => {
    const editor = setup('# comment\ntitle: \'original\'\nflag: false\ncount: 0\nempty: ""\ndate: 2026-10-27')
    const before = editor.markdown()
    open()
    for (const [key, value] of [
      ['title', 'original'],
      ['flag', 'false'],
      ['count', '0'],
      ['empty', ''],
      ['date', '2026-10-27']
    ]) {
      fireEvent.change(valueField(key), { target: { value: 'temporary' } })
      fireEvent.change(valueField(key), { target: { value } })
    }
    editor.onChange.mockClear()
    await save()
    expect(editor.markdown()).toBe(before)
    expect(editor.onChange).not.toHaveBeenCalled()
  })

  it('saves an empty string in an edited field and a newly added field', async () => {
    const editor = setup('title: original')
    open()
    fireEvent.change(valueField('title'), { target: { value: '' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add entry' }))
    fireEvent.change(screen.getAllByRole('textbox', { name: 'Key' })[1], { target: { value: 'new' } })
    await save()
    expect(parse(editor.markdown())).toEqual({ title: '', new: '' })
  })

  it.each([
    ['flag', 'false', 'false'],
    ['count', '0', '0'],
    ['nothing', 'null', '']
  ])('preserves the original %s baseline across adding and removing a row', async (key, yamlValue, inputValue) => {
    const editor = setup(`# retain comment and formatting\n${key}: ${yamlValue}`)
    const before = editor.markdown()
    open()
    fireEvent.change(valueField(key), { target: { value: 'temporary' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add entry' }))
    const addedKey = screen.getAllByRole('textbox', { name: 'Key' })[1]
    fireEvent.click(addedKey.closest('tr')!.querySelector('button')!)
    fireEvent.change(valueField(key), { target: { value: inputValue } })
    editor.onChange.mockClear()
    await save()
    expect(editor.markdown()).toBe(before)
    expect(editor.onChange).not.toHaveBeenCalled()
  })

  it('keeps row baselines attached to their identities after earlier removal, renaming and insertion', async () => {
    const editor = setup('before: remove me\nflag: false\ncount: 0\nnothing: null')
    open()
    for (const key of ['flag', 'count', 'nothing']) {
      fireEvent.change(valueField(key), { target: { value: 'temporary' } })
    }
    const flagKey = within(valueField('flag').closest('tr')!).getByRole('textbox', { name: 'Key' })
    fireEvent.change(flagKey, { target: { value: 'renamed' } })
    fireEvent.click(valueField('before').closest('tr')!.querySelector('button')!)
    fireEvent.click(screen.getByRole('button', { name: 'Add entry' }))
    const addedKey = screen.getAllByRole('textbox', { name: 'Key' }).at(-1)!
    fireEvent.change(addedKey, { target: { value: 'flag' } })
    fireEvent.change(valueField('flag'), { target: { value: 'false' } })
    for (const [key, value] of [
      ['renamed', 'false'],
      ['count', '0'],
      ['nothing', '']
    ]) {
      fireEvent.change(valueField(key), { target: { value } })
    }
    await save()
    expect(parse(editor.markdown())).toEqual({ renamed: false, count: 0, nothing: null, flag: 'false' })
  })

  it('discards canceled edits and loads external changes when reopened', async () => {
    const editor = setup('title: original')
    open()
    fireEvent.change(valueField('title'), { target: { value: 'discarded' } })
    fireEvent.click(screen.getAllByRole('button', { name: 'Cancel' })[0])
    open()
    expect(valueField('title')).toHaveValue('original')
    fireEvent.click(screen.getAllByRole('button', { name: 'Cancel' })[0])
    act(() => {
      editor.ref.current!.setMarkdown('---\ntitle: external\n---\n\nBody')
    })
    open()
    await waitFor(() => {
      expect(valueField('title')).toHaveValue('external')
    })
  })

  it('removes frontmatter only after all rows are explicitly deleted and saved', async () => {
    const editor = setup('title: original')
    const dialog = open()
    fireEvent.click(within(dialog).getByRole('table').querySelector('tbody button')!)
    await save()
    expect(editor.markdown()).toBe('Body')
  })

  it('disables saving and row changes in read-only mode', () => {
    const editor = setup('title: original', { readOnly: true })
    const before = editor.markdown()
    const dialog = open()
    expect(valueField('title')).toHaveAttribute('readonly')
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Add entry' })).toBeDisabled()
    expect(within(dialog).getByRole('table').querySelector('tbody button')).toBeDisabled()
    fireEvent.submit(dialog.querySelector('form')!)
    expect(editor.markdown()).toBe(before)
  })

  it.each(['cover: [', 'scalar', '[one, two]', 'null', 'id: 9223372036854775807', '# only a comment', 'recursive: &loop [*loop]'])(
    'keeps unsupported source intact instead of offering a lossy/raw form: %s',
    (yaml) => {
      const editor = setup(yaml)
      const before = editor.markdown()
      const dialog = open()
      expect(screen.getByRole('alert')).toHaveTextContent('Edit the Markdown source instead.')
      expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
      expect(screen.getByRole('button', { name: 'Add entry' })).toBeDisabled()
      expect(dialog.querySelector('textarea')).toBeNull()
      fireEvent.submit(dialog.querySelector('form')!)
      expect(editor.markdown()).toBe(before)
      fireEvent.click(screen.getAllByRole('button', { name: 'Cancel' })[0])
      expect(editor.markdown()).toBe(before)
    }
  )

  it('uses the translation callback for the controlled invalid-source message', () => {
    const translation = vi.fn((key: string, fallback: string) =>
      key === 'frontmatterEditor.invalidYaml' ? '请在 Markdown 源码中修改前置元数据。' : fallback
    )
    setup('cover: [', { translation })
    open()
    expect(screen.getByRole('alert')).toHaveTextContent('请在 Markdown 源码中修改前置元数据。')
    expect(screen.getByRole('alert')).not.toHaveTextContent('YAMLException')
  })
})

function CustomFrontmatter({ yaml, onChange }: FrontmatterEditorProps) {
  return (
    <button
      onClick={() => {
        onChange('title: custom')
      }}
    >
      Custom: {yaml}
    </button>
  )
}
function OtherFrontmatter({ yaml }: FrontmatterEditorProps) {
  return <output aria-label="Other frontmatter">{yaml}</output>
}

describe('frontmatter editor component extension', () => {
  it('passes delimiter-free current YAML and commits onChange from a custom component', async () => {
    const editor = setup('title: original', { plugins: [frontmatterPlugin({ FrontmatterEditor: CustomFrontmatter })] })
    expect(screen.getByRole('button', { name: 'Custom: title: original' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Custom: title: original' }))
    await waitFor(() => {
      expect(editor.markdown()).toBe('---\ntitle: custom\n---\n\nBody')
    })
    expect(screen.getByRole('button', { name: 'Custom: title: custom' })).toBeInTheDocument()
    act(() => {
      editor.ref.current!.setMarkdown('---\ntitle: external\n---\n\nBody')
    })
    expect(await screen.findByRole('button', { name: 'Custom: title: external' })).toBeInTheDocument()
  })

  it('updates existing nodes when the option changes and restores the default when omitted', () => {
    const editor = setup('title: original', {
      plugins: [frontmatterPlugin({ FrontmatterEditor: CustomFrontmatter }), toolbarPlugin({ toolbarContents: () => <OpenFrontmatter /> })]
    })
    const toolbar = toolbarPlugin({ toolbarContents: () => <OpenFrontmatter /> })
    editor.rerenderEditor({ plugins: [frontmatterPlugin({ FrontmatterEditor: OtherFrontmatter }), toolbar] })
    expect(screen.queryByRole('button', { name: /Custom:/ })).not.toBeInTheDocument()
    expect(screen.getByLabelText('Other frontmatter')).toHaveTextContent('title: original')
    editor.rerenderEditor({ plugins: [frontmatterPlugin(), toolbar] })
    expect(screen.queryByLabelText('Other frontmatter')).not.toBeInTheDocument()
    open()
    expect(valueField('title')).toHaveValue('original')
  })

  it('does not allow a custom component to change a read-only document', () => {
    const editor = setup('title: original', { readOnly: true, plugins: [frontmatterPlugin({ FrontmatterEditor: CustomFrontmatter })] })
    const before = editor.markdown()
    fireEvent.click(screen.getByRole('button', { name: 'Custom: title: original' }))
    expect(editor.markdown()).toBe(before)
  })
})
