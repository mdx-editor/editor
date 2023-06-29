import React from 'react'
import { describe, expect, it } from 'vitest'
import { MDXEditor, MDXEditorMethods } from '../'
import { render, act } from '@testing-library/react'

// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

function testIdenticalMarkdown(markdown: string) {
  const ref = React.createRef<MDXEditorMethods>()
  render(<MDXEditor ref={ref} markdown={markdown} />)
  expect(ref.current?.getMarkdown().trim()).toEqual(markdown.trim())
}

// TODO: Add a method that lets you access the lexical editor
/**
describe.skip('converting', () => {
  it('moves whitespace out of bold formatting markers', () => {
    const { editor } = testEnv
    editor.update(() => {
      const paragraph = $createParagraphNode()
      const node = $createTextNode('Hello World ')
      node.setFormat('bold')
      paragraph.append(node)
      $getRoot().append(paragraph)
      expect(exportMarkdownUtil($getRoot())).toEqual('**Hello World**&#x20;\n')
    })
  })

  it('moves whitespace out of nested formatting markers', () => {
    const { editor } = testEnv
    editor.update(() => {
      const paragraph = $createParagraphNode()
      const node = $createTextNode('Hello World ')
      node.setFormat(0b11)
      paragraph.append(node)
      $getRoot().append(paragraph)
      expect(exportMarkdownUtil($getRoot())).toEqual('***Hello World***&#x20;\n')
    })
  })

  it('moves leading whitespace out of bold formatting markers', () => {
    const { editor } = testEnv
    editor.update(() => {
      const paragraph = $createParagraphNode()
      const node = $createTextNode(' Hello World')
      node.setFormat('bold')
      paragraph.append(node)
      $getRoot().append(paragraph)
      expect(exportMarkdownUtil($getRoot())).toEqual('&#x20;**Hello World**\n')
    })
  })

  it('moves leading whitespace out of nested formatting markers', () => {
    const { editor } = testEnv
    editor.update(() => {
      const paragraph = $createParagraphNode()
      const node = $createTextNode(' Hello World')
      node.setFormat(0b11)
      paragraph.append(node)
      $getRoot().append(paragraph)
      expect(exportMarkdownUtil($getRoot())).toEqual('&#x20;***Hello World***\n')
    })
  })
})
*/

describe('markdown import export', () => {
  it('works with an empty string', () => {
    testIdenticalMarkdown('')
  })

  it('works with a simple paragraph', () => {
    testIdenticalMarkdown('Hello World\n')
  })

  it('works with a line break', () => {
    testIdenticalMarkdown(`Hello\nWorld`)
  })

  it('works with two paragraphs', () => {
    testIdenticalMarkdown(`Hello\n\nWorld`)
  })

  it('works with two paragraphs', () => {
    testIdenticalMarkdown(`Hello\n\nWorld`)
  })

  it('works with italics', () => {
    testIdenticalMarkdown(`*Hello* World`)
  })

  it('works with strong', () => {
    testIdenticalMarkdown(`**Hello** World`)
  })

  it('works with underline', () => {
    testIdenticalMarkdown(`<u>Hello</u> World`)
  })

  it('works with nested crazy formatting', () => {
    const md = `
*Hello **world** some more*

**Hello *world*<u>some</u> more**
`
    testIdenticalMarkdown(md)
  })

  it('supports inline code', () => {
    testIdenticalMarkdown('Hello `const` World')
  })

  it('supports links', () => {
    testIdenticalMarkdown(`[Virtuoso](https://virtuoso.dev/) World`)
  })

  it('supports headings', () => {
    const md = `
# Hello

## World
`
    testIdenticalMarkdown(md)
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
    testIdenticalMarkdown(md)
  })

  it('supports markdown blockquotes', () => {
    const md = `
Hello!

> Hello *bold* World
> Virtuoso

Line
`

    testIdenticalMarkdown(md)
  })

  it.todo('supports code blocks', () => {
    const md = `
Hello Js!

\`\`\`
const hello = 'world'
\`\`\`
`

    testIdenticalMarkdown(md)
  })

  it('supports horizontal rules (thematic breaks)', () => {
    const md = `
Try to put a blank line before...

***

...and after a horizontal rule.
`

    testIdenticalMarkdown(md)
  })

  it('supports images', () => {
    const md = `
      ![The San Juan Mountains are beautiful!](/assets/images/san-juan-mountains.jpg "San Juan Mountains")
      `
    testIdenticalMarkdown(md)
  })

  it('supports frontmatter', () => {
    const md = `
---
id: my-favorite-page
title: My Favorite page
---

# Hello world
      `.trim()
    testIdenticalMarkdown(md)
  })
})

/*
describe.skip('mdx jsx components', () => {
  const jsxDescriptors: JsxComponentDescriptors = [
    {
      name: 'A1',
      kind: 'text',
      source: './some/place.js',
      props: []
    },
    {
      name: 'A2',
      kind: 'text',
      source: './some/place.js',
      props: []
    }
  ]

  initializeUnitTest((testEnv) => {
    it('understands imports and jsx', () => {
      const md = `
import { A1, A2 } from './some/place.js'

An <A1 /> <A2 /> component.
    `.trim()

      testIdenticalMarkdown(md, undefined, jsxDescriptors)
    })
    it('puts imports below frontmatter', () => {
      const md = `
---
id: my-favorite-page
---

import { A1, A2 } from './some/place.js'

An <A1 /> <A2 /> component.
    `.trim()

      testIdenticalMarkdown(md, undefined, jsxDescriptors)
    })
  })
  it.todo('supports nested content in jsx components')
})
*/

describe('markdown export options', () => {
  it('accepts bullet configuration', () => {
    const md = ` 
- Bullet 1
- Bullet 2
`.trim()

    const ref = React.createRef<MDXEditorMethods>()
    act(() => {
      render(
        <MDXEditor
          ref={ref}
          markdown={md}
          lexicalConvertOptions={{
            markdownOptions: {
              bullet: '-',
              listItemIndent: 'one'
            }
          }}
        />
      )
    })

    expect(ref.current?.getMarkdown().trim()).toEqual(md)
  })
})
