import React from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { addNestedEditorChild$, GenericJsxEditor, JsxComponentDescriptor, MDXEditor, MDXEditorMethods, jsxPlugin, realmPlugin } from '../'
import { render, act, fireEvent, waitFor } from '@testing-library/react'
import { fromMarkdown } from 'mdast-util-from-markdown'
import { mdxFromMarkdown } from 'mdast-util-mdx'
import { mdxjs } from 'micromark-extension-mdxjs'
import { JsxKindMismatchError, reconcileJsxKindMismatches } from '../plugins/jsx/reconcileJsxKind'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $createParagraphNode, $createTextNode, $getRoot, createEditor, ParagraphNode, TextNode, type LexicalEditor } from 'lexical'
import type * as Mdast from 'mdast'
import { importMdastTreeToLexical, type MdastTreeImportOptions } from '../importMarkdownToLexical'
import { MdastRootVisitor } from '../plugins/core/MdastRootVisitor'
import { MdastParagraphVisitor } from '../plugins/core/MdastParagraphVisitor'
import { MdastTextVisitor } from '../plugins/core/MdastTextVisitor'
import { $isLexicalJsxNode, LexicalJsxNode } from '../plugins/jsx/LexicalJsxNode'
import { MdastMdxJsxElementVisitor } from '../plugins/jsx/MdastMdxJsxElementVisitor'

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

const issue962Markdown = '<Card.Header as="h3"><Icon name="video" /> Fotorückblick 2001 + 2002</Card.Header>'

const issue962Descriptors: JsxComponentDescriptor[] = [
  {
    name: 'Card.Header',
    kind: 'flow',
    props: [{ name: 'as', type: 'string' }],
    hasChildren: true,
    Editor: GenericJsxEditor
  },
  {
    name: 'Icon',
    kind: 'text',
    props: [{ name: 'name', type: 'string' }],
    hasChildren: false,
    Editor: GenericJsxEditor
  }
]

const parseMdx = (markdown: string) =>
  fromMarkdown(markdown, {
    extensions: [mdxjs()],
    mdastExtensions: [mdxFromMarkdown()]
  })

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
    expect(processedMarkdown).toContain(`<Wrapper>\n  <Section />\n</Wrapper>`)
  })

  it('preserves parser semantics by default when a descriptor kind differs from the parsed JSX kind', async () => {
    let nestedEditor: LexicalEditor | null = null
    function CaptureNestedEditor() {
      ;[nestedEditor] = useLexicalComposerContext()
      return null
    }
    const captureNestedEditorPlugin = realmPlugin({
      init(realm) {
        realm.pub(addNestedEditorChild$, CaptureNestedEditor)
      }
    })
    const ref = React.createRef<MDXEditorMethods>()
    const onError = vi.fn()
    const { container } = render(
      <MDXEditor
        ref={ref}
        markdown={issue962Markdown}
        onError={onError}
        plugins={[captureNestedEditorPlugin(), jsxPlugin({ jsxComponentDescriptors: issue962Descriptors })]}
      />
    )

    await waitFor(() => {
      expect(container.querySelectorAll('[contenteditable="true"]')).toHaveLength(2)
      expect(nestedEditor).not.toBeNull()
    })
    const nestedEditorElement = container.querySelectorAll('[contenteditable="true"]')[1]
    expect(nestedEditorElement.textContent).toContain('Fotorückblick 2001 + 2002')

    act(() => {
      nestedEditor!.update(
        () => {
          $getRoot()
            .clear()
            .append($createParagraphNode().append($createTextNode('Changed in the nested editor')))
        },
        { discrete: true }
      )
    })
    fireEvent.blur(nestedEditorElement)

    await waitFor(() => {
      expect(ref.current?.getMarkdown()).toBe('<Card.Header as="h3">Changed in the nested editor</Card.Header>')
    })
    expect(onError).not.toHaveBeenCalled()
  })

  it('preserves a parsed flow JSX kind when the descriptor declares text by default', async () => {
    const markdown = '<Badge>\ncontent\n</Badge>'
    const descriptors: JsxComponentDescriptor[] = [{ name: 'Badge', kind: 'text', props: [], hasChildren: true, Editor: GenericJsxEditor }]
    const ref = React.createRef<MDXEditorMethods>()
    const onError = vi.fn()
    const { container } = render(
      <MDXEditor ref={ref} markdown={markdown} onError={onError} plugins={[jsxPlugin({ jsxComponentDescriptors: descriptors })]} />
    )

    await waitFor(() => {
      expect(container.querySelectorAll('[contenteditable="true"]')).toHaveLength(2)
    })
    fireEvent.blur(container.querySelectorAll('[contenteditable="true"]')[1])

    await waitFor(() => {
      expect(parseMdx(ref.current?.getMarkdown() ?? '').children[0]?.type).toBe('mdxJsxFlowElement')
    })
    expect(onError).not.toHaveBeenCalled()
  })

  it('does not apply a wildcard JSX policy to elements owned by the HTML visitor', async () => {
    const onError = vi.fn()
    const descriptors: JsxComponentDescriptor[] = [{ name: '*', kind: 'flow', props: [], hasChildren: true, Editor: GenericJsxEditor }]
    const { container } = render(
      <MDXEditor
        markdown="<span>text</span>"
        onError={onError}
        plugins={[jsxPlugin({ jsxComponentDescriptors: descriptors, kindMismatchPolicy: 'error' })]}
      />
    )

    await waitFor(() => {
      expect(container.querySelector('span')?.textContent).toBe('text')
    })
    expect(onError).not.toHaveBeenCalled()
  })

  it('applies normalization to direct MDAST tree imports', () => {
    const editor = createEditor({
      namespace: 'jsx-kind-normalization-test',
      nodes: [ParagraphNode, TextNode, LexicalJsxNode],
      onError(error) {
        throw error
      }
    })

    editor.update(
      () => {
        importMdastTreeToLexical({
          root: $getRoot(),
          mdastRoot: parseMdx(issue962Markdown),
          visitors: [
            MdastRootVisitor,
            MdastParagraphVisitor,
            MdastTextVisitor,
            MdastMdxJsxElementVisitor
          ] as unknown as MdastTreeImportOptions['visitors'],
          jsxComponentDescriptors: issue962Descriptors,
          jsxKindMismatchPolicy: 'normalize',
          directiveDescriptors: [],
          codeBlockEditorDescriptors: [],
          defaultCodeBlockLanguage: ''
        })
      },
      { discrete: true }
    )

    editor.getEditorState().read(() => {
      const jsxNode = $getRoot().getFirstChild()
      expect($isLexicalJsxNode(jsxNode)).toBe(true)
      if (!$isLexicalJsxNode(jsxNode)) {
        throw new Error('Expected a JSX node')
      }
      expect(jsxNode.getMdastNode().type).toBe('mdxJsxFlowElement')
    })
  })

  it('normalizes a standalone text JSX element to its declared flow kind', async () => {
    const parsed = parseMdx(issue962Markdown)
    const normalized = reconcileJsxKindMismatches(parsed, issue962Descriptors, 'normalize')
    const card = normalized.children[0]

    expect(parsed.children[0].type).toBe('paragraph')
    expect(card.type).toBe('mdxJsxFlowElement')
    if (card.type !== 'mdxJsxFlowElement') {
      throw new Error('Expected a flow JSX element')
    }
    expect(card.children).toHaveLength(1)
    expect(card.children[0]).toMatchObject({
      type: 'paragraph',
      children: [
        { type: 'mdxJsxTextElement', name: 'Icon' },
        { type: 'text', value: ' Fotorückblick 2001 + 2002' }
      ]
    })
    expect(reconcileJsxKindMismatches(normalized, issue962Descriptors, 'normalize')).toEqual(normalized)

    const formatted = reconcileJsxKindMismatches(
      parseMdx('<Card.Header>*emphasis* and `code`</Card.Header>'),
      issue962Descriptors,
      'normalize'
    )
    expect(formatted.children[0]).toMatchObject({
      type: 'mdxJsxFlowElement',
      children: [
        {
          type: 'paragraph',
          children: [{ type: 'emphasis' }, { type: 'text', value: ' and ' }, { type: 'inlineCode', value: 'code' }]
        }
      ]
    })

    const ref = React.createRef<MDXEditorMethods>()
    const onError = vi.fn()
    const { container } = render(
      <MDXEditor
        ref={ref}
        markdown={issue962Markdown}
        onError={onError}
        plugins={[jsxPlugin({ jsxComponentDescriptors: issue962Descriptors, kindMismatchPolicy: 'normalize' })]}
      />
    )

    await waitFor(() => {
      expect(container.querySelectorAll('[contenteditable="true"]')).toHaveLength(2)
    })
    fireEvent.blur(container.querySelectorAll('[contenteditable="true"]')[1])

    await waitFor(() => {
      const exported = ref.current?.getMarkdown() ?? ''
      expect(parseMdx(exported).children[0]?.type).toBe('mdxJsxFlowElement')
      expect(exported).toContain('Fotorückblick 2001 + 2002')
    })
    expect(onError).not.toHaveBeenCalled()
  })

  it('normalizes one flow paragraph to a declared text JSX kind', async () => {
    const descriptors: JsxComponentDescriptor[] = [{ name: 'Badge', kind: 'text', props: [], hasChildren: true, Editor: GenericJsxEditor }]
    const markdown = '<Badge>\ncontent\n</Badge>'
    const normalized = reconcileJsxKindMismatches(parseMdx(markdown), descriptors, 'normalize')

    expect(normalized.children[0]).toMatchObject({
      type: 'paragraph',
      children: [{ type: 'mdxJsxTextElement', name: 'Badge', children: [{ type: 'text', value: 'content' }] }]
    })

    const ref = React.createRef<MDXEditorMethods>()
    const onError = vi.fn()
    const { container } = render(
      <MDXEditor
        ref={ref}
        markdown={markdown}
        onError={onError}
        plugins={[jsxPlugin({ jsxComponentDescriptors: descriptors, kindMismatchPolicy: 'normalize' })]}
      />
    )
    await waitFor(() => {
      expect(container.querySelectorAll('[contenteditable="true"]')).toHaveLength(2)
    })
    fireEvent.blur(container.querySelectorAll('[contenteditable="true"]')[1])
    await waitFor(() => {
      const reparsed = parseMdx(ref.current?.getMarkdown() ?? '')
      expect(reparsed.children[0]).toMatchObject({
        type: 'paragraph',
        children: [{ type: 'mdxJsxTextElement', name: 'Badge' }]
      })
    })
    expect(onError).not.toHaveBeenCalled()
  })

  it('normalizes an empty flow JSX element to text without data loss', () => {
    const descriptors: JsxComponentDescriptor[] = [{ name: 'Badge', kind: 'text', props: [], hasChildren: true, Editor: GenericJsxEditor }]
    const normalized = reconcileJsxKindMismatches(parseMdx('<Badge />'), descriptors, 'normalize')

    expect(normalized.children[0]).toMatchObject({
      type: 'paragraph',
      children: [{ type: 'mdxJsxTextElement', name: 'Badge', children: [] }]
    })
  })

  it.each([
    {
      name: 'a block descriptor inside a heading',
      markdown: '# <Block>content</Block>',
      descriptors: [{ name: 'Block', kind: 'flow', props: [], hasChildren: true, Editor: GenericJsxEditor }]
    },
    {
      name: 'a text descriptor containing a non-paragraph block',
      markdown: '<Inline>\n# Heading\n</Inline>',
      descriptors: [{ name: 'Inline', kind: 'text', props: [], hasChildren: true, Editor: GenericJsxEditor }]
    }
  ])('rejects normalization for $name', ({ markdown, descriptors }) => {
    expect(() => reconcileJsxKindMismatches(parseMdx(markdown), descriptors as JsxComponentDescriptor[], 'normalize')).toThrowError(
      JsxKindMismatchError
    )
  })

  it('rejects a mismatch under an MDAST parent with an unknown content model', () => {
    const jsxNode = (parseMdx('<Block>content</Block>').children[0] as Mdast.Paragraph).children[0]
    const tree = {
      type: 'root',
      children: [{ type: 'customParent', children: [jsxNode] }]
    } as unknown as Mdast.Root
    const descriptors: JsxComponentDescriptor[] = [{ name: 'Block', kind: 'flow', props: [], hasChildren: true, Editor: GenericJsxEditor }]

    expect(() => reconcileJsxKindMismatches(tree, descriptors, 'normalize')).toThrowError(
      'customParent parent does not declare whether its children are flow or phrasing content'
    )
  })

  it('applies an updated mismatch policy to later Markdown imports', async () => {
    const ref = React.createRef<MDXEditorMethods>()
    const { container, rerender } = render(
      <MDXEditor
        ref={ref}
        markdown=""
        plugins={[jsxPlugin({ jsxComponentDescriptors: issue962Descriptors, kindMismatchPolicy: 'source' })]}
      />
    )

    rerender(
      <MDXEditor
        ref={ref}
        markdown=""
        plugins={[jsxPlugin({ jsxComponentDescriptors: issue962Descriptors, kindMismatchPolicy: 'normalize' })]}
      />
    )
    await flushEditorUpdates()
    act(() => {
      ref.current?.setMarkdown(issue962Markdown)
    })

    await waitFor(() => {
      expect(container.querySelectorAll('[contenteditable="true"]')).toHaveLength(2)
    })
    fireEvent.blur(container.querySelectorAll('[contenteditable="true"]')[1])
    await waitFor(() => {
      expect(parseMdx(ref.current?.getMarkdown() ?? '').children[0]?.type).toBe('mdxJsxFlowElement')
    })
  })

  it.each([
    {
      name: 'a block descriptor embedded in surrounding phrasing',
      markdown: 'Before <Block>content</Block> after',
      descriptors: [{ name: 'Block', kind: 'flow', props: [], hasChildren: true, Editor: GenericJsxEditor }]
    },
    {
      name: 'a text descriptor with multiple flow blocks',
      markdown: '<Inline>\nfirst\n\nsecond\n</Inline>',
      descriptors: [{ name: 'Inline', kind: 'text', props: [], hasChildren: true, Editor: GenericJsxEditor }]
    }
  ])('reports an actionable normalization error for $name', async ({ markdown, descriptors }) => {
    const ref = React.createRef<MDXEditorMethods>()
    const onError = vi.fn<[payload: { error: string; source: string }]>()
    render(
      <MDXEditor
        ref={ref}
        markdown={markdown}
        onError={onError}
        plugins={[jsxPlugin({ jsxComponentDescriptors: descriptors as JsxComponentDescriptor[], kindMismatchPolicy: 'normalize' })]}
      />
    )

    await waitFor(() => {
      expect(onError).toHaveBeenCalledOnce()
    })
    expect(onError.mock.calls[0][0]).toMatchObject({ source: markdown })
    expect(onError.mock.calls[0][0].error).toContain('kindMismatchPolicy: "normalize"')
    expect(ref.current?.getMarkdown()).toBe(markdown)
  })

  it('rejects named, fragment, and wildcard descriptor mismatches in strict mode', async () => {
    const namedDescriptors: JsxComponentDescriptor[] = [
      { name: 'Block', kind: 'flow', props: [], hasChildren: true, Editor: GenericJsxEditor }
    ]
    const wildcardDescriptors: JsxComponentDescriptor[] = [
      { name: '*', kind: 'flow', props: [], hasChildren: true, Editor: GenericJsxEditor }
    ]
    const fragmentDescriptors: JsxComponentDescriptor[] = [
      { name: null, kind: 'flow', props: [], hasChildren: true, Editor: GenericJsxEditor }
    ]
    const parsed = parseMdx('<Block>content</Block>')

    expect(() => reconcileJsxKindMismatches(parsed, namedDescriptors, 'error')).toThrowError(JsxKindMismatchError)
    expect(() => reconcileJsxKindMismatches(parseMdx('<>content</>'), fragmentDescriptors, 'error')).toThrowError(JsxKindMismatchError)
    expect(() => reconcileJsxKindMismatches(parseMdx('<Unknown>content</Unknown>'), wildcardDescriptors, 'error')).toThrowError(
      JsxKindMismatchError
    )
    expect(() => reconcileJsxKindMismatches(parseMdx('<Block>\ncontent\n</Block>'), namedDescriptors, 'error')).not.toThrow()

    const onError = vi.fn<[payload: { error: string; source: string }]>()
    render(
      <MDXEditor
        markdown={'<Block>content</Block>'}
        onError={onError}
        plugins={[jsxPlugin({ jsxComponentDescriptors: namedDescriptors, kindMismatchPolicy: 'error' })]}
      />
    )
    await waitFor(() => {
      expect(onError).toHaveBeenCalledOnce()
    })
    expect(onError.mock.calls[0][0].error).toContain('kindMismatchPolicy: "error"')
  })
})
