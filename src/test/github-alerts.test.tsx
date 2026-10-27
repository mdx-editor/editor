import React from 'react'
import { act, render, screen, cleanup, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { Realm } from '@mdxeditor/gurx'
import {
  $createParagraphNode,
  INSERT_PARAGRAPH_COMMAND,
  $getRoot,
  $isElementNode,
  $isTextNode,
  HISTORY_PUSH_TAG,
  UNDO_COMMAND,
  REDO_COMMAND,
  type LexicalEditor
} from 'lexical'
import { MDXEditor, type MDXEditorMethods } from '../MDXEditor'
import { fromMarkdown } from 'mdast-util-from-markdown'
import { rootEditor$, syntaxExtensions$, mdastExtensions$ } from '../plugins/core'
import {
  githubAlertsPlugin,
  GITHUB_ALERT_TYPES,
  $isGitHubAlertNode,
  applyGitHubAlertType$,
  GitHubAlertTypeSelect
} from '../plugins/github-alerts'
import { listsPlugin } from '../plugins/lists'
import { quotePlugin } from '../plugins/quote'
import { toolbarPlugin } from '../plugins/toolbar'

afterEach(cleanup)
function setup(markdown: string, readOnly = false, withQuote = false) {
  const ref = React.createRef<MDXEditorMethods>()
  let realm!: Realm
  let editor!: LexicalEditor
  const result = render(
    <MDXEditor
      ref={ref}
      markdown={markdown}
      readOnly={readOnly}
      plugins={[
        ...(withQuote ? [quotePlugin()] : []),
        githubAlertsPlugin(),
        listsPlugin(),
        toolbarPlugin({ toolbarContents: () => <GitHubAlertTypeSelect /> }),
        {
          postInit(r) {
            realm = r
            editor = r.getValue(rootEditor$)!
          }
        }
      ]}
    />
  )
  return {
    ...result,
    ref,
    get editor() {
      return editor
    },
    get realm() {
      return realm
    }
  }
}

describe('GitHub alerts', () => {
  it.each(GITHUB_ALERT_TYPES)('round trips %s with inline formatting', (type) => {
    const markdown = `> [!${type}]\n> A **bold** and *italic* message.`
    const { ref, container } = setup(markdown)
    expect(container.querySelector(`[data-github-alert="${type}"]`)).not.toBeNull()
    expect(ref.current!.getMarkdown()).toBe(markdown)
  })
  it('preserves multiple paragraphs and lists through source replacement', () => {
    const markdown = '> [!IMPORTANT]\n> First\n>\n> * one\n> * two\n>\n> Last'
    const { ref } = setup(markdown)
    expect(ref.current!.getMarkdown()).toBe(markdown)
    act(() => {
      ref.current!.setMarkdown(ref.current!.getMarkdown())
    })
    expect(ref.current!.getMarkdown()).toBe(markdown)
  })
  it.each([
    '> Ordinary quote',
    '> \\[!NOTE]\n> Literal marker',
    '> &#91;!NOTE]\n> Literal entity',
    '> [!UNKNOWN]\n> Leave intact',
    '> Before [!NOTE]\n> Leave intact',
    '> [!NOTE] inline',
    '> [!NOTE]**inline**'
  ])('keeps ordinary quotes: %s', (markdown) => {
    const { ref, container } = setup(markdown)
    expect(container.querySelector('[data-github-alert]')).toBeNull()
    // Markdown may escape literal brackets; a second import preserves its meaning.
    const output = ref.current!.getMarkdown()
    act(() => {
      ref.current!.setMarkdown(output)
    })
    expect(ref.current!.getMarkdown()).toBe(output)
  })
  it('does not require quotePlugin and coexists with it', () => {
    const { ref } = setup('> [!TIP]\n> Tip\n\n> Ordinary quote', false, true)
    expect(ref.current!.getMarkdown()).toBe('> [!TIP]\n> Tip\n\n> Ordinary quote')
  })
  it('keeps empty alerts editable', () => {
    const { editor, ref } = setup('> [!NOTE]')
    editor.getEditorState().read(() => {
      const alert = $getRoot().getFirstChildOrThrow()
      expect($isGitHubAlertNode(alert)).toBe(true)
      expect($isElementNode(alert) && alert.getChildrenSize()).toBe(1)
    })
    expect(ref.current!.getMarkdown()).toContain('> [!NOTE]')
  })
  it('changes type with undo and redo, preserving content', async () => {
    const { editor, realm, ref } = setup('> [!NOTE]\n> Content')
    act(() => {
      editor.update(() => $getRoot().getFirstChildOrThrow().selectEnd(), { discrete: true })
    })
    act(() => {
      realm.pub(applyGitHubAlertType$, 'WARNING')
    })
    await waitFor(() => {
      expect(ref.current!.getMarkdown()).toBe('> [!WARNING]\n> Content')
    })
    act(() => {
      editor.dispatchCommand(UNDO_COMMAND, undefined)
    })
    await waitFor(() => {
      expect(ref.current!.getMarkdown()).toBe('> [!NOTE]\n> Content')
    })
    act(() => {
      editor.dispatchCommand(REDO_COMMAND, undefined)
    })
    await waitFor(() => {
      expect(ref.current!.getMarkdown()).toBe('> [!WARNING]\n> Content')
    })
  })
  it('blocks type changes in readOnly, including direct signal publication', async () => {
    const { editor, realm, ref } = setup('> [!NOTE]\n> Content', true)
    expect(screen.getByRole('combobox', { name: 'GitHub alert' })).toBeDisabled()
    act(() => {
      editor.update(() => $getRoot().getFirstChildOrThrow().selectEnd(), { discrete: true })
    })
    act(() => {
      realm.pub(applyGitHubAlertType$, 'WARNING')
    })
    await act(async () => {
      await Promise.resolve()
    })
    expect(ref.current!.getMarkdown()).toBe('> [!NOTE]\n> Content')
  })
  it('edits content with the normal Lexical history', async () => {
    const { editor, ref } = setup('> [!TIP]\n> Initial')
    act(() => {
      editor.update(() => $getRoot().getFirstChildOrThrow().selectEnd(), { discrete: true })
    })
    act(() => {
      editor.update(
        () => {
          const text = $getRoot().getFirstDescendant()!
          if ($isTextNode(text)) text.setTextContent('Changed')
        },
        { discrete: true, tag: HISTORY_PUSH_TAG }
      )
    })
    expect(ref.current!.getMarkdown()).toBe('> [!TIP]\n> Changed')
    act(() => {
      editor.dispatchCommand(UNDO_COMMAND, undefined)
    })
    await waitFor(() => {
      expect(ref.current!.getMarkdown()).toBe('> [!TIP]\n> Initial')
    })
  })
  it('inserts an alert outside the existing content and undoes it', async () => {
    const { editor, realm, ref } = setup('Original')
    act(() => {
      editor.update(() => $getRoot().getFirstChildOrThrow().selectEnd(), { discrete: true })
    })
    act(() => {
      realm.pub(applyGitHubAlertType$, 'CAUTION')
    })
    await waitFor(() => {
      expect(ref.current!.getMarkdown()).toContain('> [!CAUTION]')
    })
    expect(ref.current!.getMarkdown()).toContain('Original')
    act(() => {
      editor.dispatchCommand(UNDO_COMMAND, undefined)
    })
    await waitFor(() => {
      expect(ref.current!.getMarkdown()).toBe('Original')
    })
  })
  it('exits an empty final paragraph on Enter without losing content', async () => {
    const { editor, ref } = setup('> [!TIP]\n> Content')
    act(() => {
      editor.update(
        () => {
          const alert = $getRoot().getFirstChildOrThrow()
          if ($isGitHubAlertNode(alert)) alert.append($createParagraphNode()).selectEnd()
        },
        { discrete: true }
      )
    })
    act(() => {
      editor.dispatchCommand(INSERT_PARAGRAPH_COMMAND, undefined)
    })
    await waitFor(() => {
      expect(ref.current!.getMarkdown()).toBe('> [!TIP]\n> Content')
    })
    editor.getEditorState().read(() => {
      const alert = $getRoot().getFirstChildOrThrow()
      expect($isGitHubAlertNode(alert) && alert.getChildrenSize()).toBe(1)
    })
  })
  it('preserves Lexical JSON serialization of alert type and content', () => {
    const { editor, ref } = setup('> [!IMPORTANT]\n> Content')
    const json = JSON.stringify(editor.getEditorState().toJSON())
    act(() => {
      editor.setEditorState(editor.parseEditorState(json))
    })
    expect(ref.current!.getMarkdown()).toBe('> [!IMPORTANT]\n> Content')
  })
})

describe('additional ordinary Markdown regression audit', () => {
  it.each([
    'See [!NOTE]\n\n[!NOTE]: https://example.com',
    '> Quote has a [!TIP]\n\n[!TIP]: https://example.com',
    '> [!WARNING]\n> See [!TIP]\n\n[!TIP]: https://example.com'
  ])('preserves the reference link AST in %s', (markdown) => {
    const { realm } = setup('')
    const tree = fromMarkdown(markdown, {
      extensions: realm.getValue(syntaxExtensions$),
      mdastExtensions: realm.getValue(mdastExtensions$)
    })
    expect(JSON.stringify(tree)).toContain('"type":"linkReference"')
    expect(JSON.stringify(tree)).toContain('"url":"https://example.com"')
  })
})

describe('additional marker source audit', () => {
  it.each(['\n', '\r\n', '\r'])('recognizes a standalone marker with %j line ending', (eol) => {
    const { container, ref } = setup('> [!NOTE]' + eol + '> Body')
    expect(container.querySelector('[data-github-alert="NOTE"]')).not.toBeNull()
    expect(ref.current!.getMarkdown()).toBe('> [!NOTE]\n> Body')
  })
})

it('recognizes the first-line marker even when its label is defined as a reference', () => {
  const { realm } = setup('')
  const tree = fromMarkdown('> [!NOTE]\n> Body uses [!TIP]\n\n[!NOTE]: /marker\n[!TIP]: /body', {
    extensions: realm.getValue(syntaxExtensions$),
    mdastExtensions: realm.getValue(mdastExtensions$)
  })
  const quote = tree.children[0]
  expect(quote.type).toBe('blockquote')
  if (quote.type !== 'blockquote') throw new Error('Expected a block quote')
  const paragraph = quote.children[0]
  expect(paragraph.type).toBe('paragraph')
  if (paragraph.type !== 'paragraph') throw new Error('Expected a paragraph')
  expect(paragraph.children[0]).toMatchObject({ type: 'text', value: '[!NOTE]', data: { githubAlertMarker: true } })
  expect(paragraph.children.at(-1)).toMatchObject({ type: 'linkReference', identifier: '!tip' })
})
