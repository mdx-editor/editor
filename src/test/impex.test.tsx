import { $createParagraphNode, $createTextNode, $getRoot, LexicalEditor } from 'lexical'
import { describe, expect, it } from 'vitest'
import { JsxComponentDescriptors, ToMarkdownOptions, exportMarkdownFromLexical, importMarkdownToLexical } from '../'
import { initializeUnitTest } from './lexical-utils'

// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

describe('importing markdown into lexical', () => {
  initializeUnitTest((testEnv) => {
    it('works with an empty string', () => {
      const { editor } = testEnv
      editor!.update(() => {
        const root = $getRoot()
        importMarkdownToLexical(root, '')
      })

      expect(editor?.getEditorState().toJSON().root).toMatchObject({
        type: 'root',
        children: [],
      })
    })

    it('converts a paragraph into root node with a paragraph > text child', () => {
      const { editor } = testEnv
      editor!.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          expect(editor?.getEditorState().toJSON().root).toMatchObject({
            type: 'root',
            children: [
              {
                type: 'paragraph',
                children: [{ type: 'text', text: 'Hello World' }],
              },
            ],
          })
        })
      })

      editor!.update(() => {
        const root = $getRoot()
        importMarkdownToLexical(root, 'Hello World')
      })
    })
  })
})

describe('converting', () => {
  initializeUnitTest((testEnv) => {
    it('generates root node from a Lexical RootNode', () => {
      const { editor } = testEnv
      editor!.update(() => {
        expect(exportMarkdownFromLexical({ root: $getRoot() })).toEqual('')
      })
    })

    it('generates a paragraph from a Lexical ParagraphNode', () => {
      const { editor } = testEnv
      editor!.update(() => {
        const paragraph = $createParagraphNode()
        paragraph.append($createTextNode('Hello World'))
        $getRoot().append(paragraph)
        expect(exportMarkdownFromLexical({ root: $getRoot() })).toEqual('Hello World\n')
      })
    })

    it('moves whitespace out of bold formatting markers', () => {
      const { editor } = testEnv
      editor!.update(() => {
        const paragraph = $createParagraphNode()
        const node = $createTextNode('Hello World ')
        node.setFormat('bold')
        paragraph.append(node)
        $getRoot().append(paragraph)
        expect(exportMarkdownFromLexical({ root: $getRoot() })).toEqual('**Hello World**&#x20;\n')
      })
    })

    it('moves whitespace out of nested formatting markers', () => {
      const { editor } = testEnv
      editor!.update(() => {
        const paragraph = $createParagraphNode()
        const node = $createTextNode('Hello World ')
        node.setFormat(0b11)
        paragraph.append(node)
        $getRoot().append(paragraph)
        expect(exportMarkdownFromLexical({ root: $getRoot() })).toEqual('***Hello World***&#x20;\n')
      })
    })

    it('moves leading whitespace out of bold formatting markers', () => {
      const { editor } = testEnv
      editor!.update(() => {
        const paragraph = $createParagraphNode()
        const node = $createTextNode(' Hello World')
        node.setFormat('bold')
        paragraph.append(node)
        $getRoot().append(paragraph)
        expect(exportMarkdownFromLexical({ root: $getRoot() })).toEqual('&#x20;**Hello World**\n')
      })
    })

    it('moves leading whitespace out of nested formatting markers', () => {
      const { editor } = testEnv
      editor!.update(() => {
        const paragraph = $createParagraphNode()
        const node = $createTextNode(' Hello World')
        node.setFormat(0b11)
        paragraph.append(node)
        $getRoot().append(paragraph)
        expect(exportMarkdownFromLexical({ root: $getRoot() })).toEqual('&#x20;***Hello World***\n')
      })
    })

    it.todo('collapses whitespace only nodes')
  })
})

function testIdenticalMarkdownAfterImportExport(
  editor: LexicalEditor,
  markdown: string,
  exportOptions?: ToMarkdownOptions,
  jsxComponentDescriptors: JsxComponentDescriptors = []
) {
  editor.registerUpdateListener(({ editorState }) => {
    editorState.read(() => {
      expect(
        exportMarkdownFromLexical({
          root: $getRoot(),
          options: exportOptions,
          visitors: undefined,
          jsxComponentDescriptors,
        })
          .trim()
          .replaceAll('&#x20;', ' ')
      ).toEqual(markdown.trim())
    })
  })

  editor.update(() => {
    const root = $getRoot()
    importMarkdownToLexical(root, markdown)
  })
}

describe('markdown import export', () => {
  initializeUnitTest((testEnv) => {
    it('works with an empty string', () => {
      testIdenticalMarkdownAfterImportExport(testEnv.editor!, '')
    })

    it('works with a simple paragraph', () => {
      testIdenticalMarkdownAfterImportExport(testEnv.editor!, 'Hello World\n')
    })

    it('works with a line break', () => {
      testIdenticalMarkdownAfterImportExport(testEnv.editor!, `Hello\nWorld`)
    })

    it('works with two paragraphs', () => {
      testIdenticalMarkdownAfterImportExport(testEnv.editor!, `Hello\n\nWorld`)
    })

    it('works with italics', () => {
      testIdenticalMarkdownAfterImportExport(testEnv.editor!, `*Hello* World`)
    })

    it('works with strong', () => {
      testIdenticalMarkdownAfterImportExport(testEnv.editor!, `**Hello** World`)
    })

    it('works with underline', () => {
      testIdenticalMarkdownAfterImportExport(testEnv.editor!, `<u>Hello</u> World`)
    })

    it('works with nested crazy formatting', () => {
      const md = `
*Hello **world** some more*

**Hello *world*<u>some</u> more**
`
      testIdenticalMarkdownAfterImportExport(testEnv.editor!, md)
    })

    it('supports inline code', () => {
      testIdenticalMarkdownAfterImportExport(testEnv.editor!, 'Hello `const` World')
    })

    it('supports links', () => {
      testIdenticalMarkdownAfterImportExport(testEnv.editor!, `[Virtuoso](https://virtuoso.dev/) World`)
    })

    it('supports headings', () => {
      const md = `
# Hello

## World
`
      testIdenticalMarkdownAfterImportExport(testEnv.editor!, md)
    })

    it('supports markdown nested formatting', () => {
      const md = `
* Hello <u>World</u> **bold**
* World
  * Nested
  * Unordered list

1. Point 1
2. Point 2
`
      testIdenticalMarkdownAfterImportExport(testEnv.editor!, md)
    })

    it('supports markdown blockquotes', () => {
      const md = `
Hello!

> Hello *bold* World
> Virtuoso

Line
`

      testIdenticalMarkdownAfterImportExport(testEnv.editor!, md)
    })

    it('supports code blocks', () => {
      const md = `
Hello Js!

\`\`\`
const hello = 'world'
\`\`\`
`

      testIdenticalMarkdownAfterImportExport(testEnv.editor!, md)
    })

    it('supports horizontal rules (thematic breaks)', () => {
      const md = `
Try to put a blank line before...

***

...and after a horizontal rule.
`

      testIdenticalMarkdownAfterImportExport(testEnv.editor!, md)
    })

    it('supports images', () => {
      const md = `
      ![The San Juan Mountains are beautiful!](/assets/images/san-juan-mountains.jpg "San Juan Mountains")
      `
      testIdenticalMarkdownAfterImportExport(testEnv.editor!, md)
    })

    it('supports frontmatter', () => {
      const md = `
---
id: my-favorite-page
title: My Favorite page
---

# Hello world
      `.trim()
      testIdenticalMarkdownAfterImportExport(testEnv.editor!, md)
    })
  })
})

describe('mdx jsx components', () => {
  const jsxDescriptors: JsxComponentDescriptors = [
    {
      name: 'A1',
      kind: 'text',
      source: './some/place.js',
      props: [],
    },
    {
      name: 'A2',
      kind: 'text',
      source: './some/place.js',
      props: [],
    },
  ]

  initializeUnitTest((testEnv) => {
    it('understands imports and jsx', () => {
      const md = `
import { A1, A2 } from './some/place.js'

An <A1 /> <A2 /> component.
    `.trim()

      testIdenticalMarkdownAfterImportExport(testEnv.editor!, md, undefined, jsxDescriptors)
    })
    it('puts imports below frontmatter', () => {
      const md = `
---
id: my-favorite-page
---

import { A1, A2 } from './some/place.js'

An <A1 /> <A2 /> component.
    `.trim()

      testIdenticalMarkdownAfterImportExport(testEnv.editor!, md, undefined, jsxDescriptors)
    })
  })
  it.todo('supports nested content in jsx components')
})

describe('markdown export options', () => {
  initializeUnitTest((testEnv) => {
    it('accepts toMarkdown options', () => {
      const md = ` - Bullet 1
- Bullet 2
      `
      testIdenticalMarkdownAfterImportExport(testEnv.editor!, md, { bullet: '-' })
    })
  })
})
