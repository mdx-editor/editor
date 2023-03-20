/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import React from 'react'
import { UsedLexicalNodes, importMarkdownToLexical, SandpackConfig, exportMarkdownFromLexical, contentTheme } from '..'
import { $getRoot, EditorState } from 'lexical'
import dataCode from './assets/dataCode.ts?raw'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin'
import { registerCodeHighlighting } from '@lexical/code'

export function standardConfig(markdown: string) {
  return {
    editorState: () => {
      importMarkdownToLexical($getRoot(), markdown)
    },
    namespace: 'MyEditor',
    theme: contentTheme,
    nodes: UsedLexicalNodes,
    onError: (error: Error) => console.error(error),
  }
}
export const sandpackConfig: SandpackConfig = {
  defaultPreset: 'react',
  presets: [
    {
      name: 'react',
      sandpackTemplate: 'react',
      sandpackTheme: 'light',
      snippetFileName: '/App.js',
    },
    {
      name: 'virtuoso',
      sandpackTemplate: 'react-ts',
      sandpackTheme: 'light',
      snippetFileName: '/App.tsx',
      dependencies: {
        'react-virtuoso': 'latest',
        '@ngneat/falso': 'latest',
      },
      files: {
        '/data.ts': dataCode,
      },
    },
  ],
}

export function convertLexicalStateToMarkdown(state: EditorState) {
  return new Promise<string>((resolve) => {
    state.read(() => {
      resolve(exportMarkdownFromLexical($getRoot()))
    })
  })
}

export function MarkdownResult({ initialCode }: { initialCode: string }) {
  const [editor] = useLexicalComposerContext()
  const [outMarkdown, setOutMarkdown] = React.useState('')
  React.useEffect(() => {
    convertLexicalStateToMarkdown(editor.getEditorState())
      .then((markdown) => {
        setOutMarkdown(markdown)
      })
      .catch((rejection) => console.warn({ rejection }))
  })

  const onChange = React.useCallback(() => {
    convertLexicalStateToMarkdown(editor.getEditorState())
      .then((markdown) => {
        setOutMarkdown(markdown)
      })
      .catch((rejection) => console.warn({ rejection }))
  }, [editor])

  return (
    <>
      <div style={{ display: 'flex', height: 400, overflow: 'auto' }}>
        <div style={{ flex: 1 }}>
          <h3>Result markdown</h3>
          <OnChangePlugin onChange={onChange} />

          <code>
            <pre>{outMarkdown.trim()}</pre>
          </code>
        </div>
        <div style={{ flex: 1 }}>
          <h3>Initial markdown</h3>
          <code>
            <pre>{initialCode.trim()}</pre>
          </code>
        </div>
      </div>
    </>
  )
}

export function CodeHighlightPlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext()

  React.useEffect(() => {
    return registerCodeHighlighting(editor)
  }, [editor])

  return null
}
