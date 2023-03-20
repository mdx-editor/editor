/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import React from 'react'
import { UsedLexicalNodes, importMarkdownToLexical, SandpackConfig, exportMarkdownFromLexical, contentTheme } from '..'
import { $getRoot, EditorState } from 'lexical'
import dataCode from './assets/dataCode.ts?raw'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin'
import { registerCodeHighlighting } from '@lexical/code'
import ReactDiffViewer from 'react-diff-viewer'

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
  const [currentMarkdown, setCurrentMarkdown] = React.useState('')

  React.useEffect(() => {
    convertLexicalStateToMarkdown(editor.getEditorState())
      .then(setCurrentMarkdown)
      .catch((rejection) => console.warn({ rejection }))
  }, [editor])

  const onChange = React.useCallback(() => {
    convertLexicalStateToMarkdown(editor.getEditorState())
      .then(setCurrentMarkdown)
      .catch((rejection) => console.warn({ rejection }))
  }, [editor])

  return (
    <>
      <OnChangePlugin onChange={onChange} />
      <ReactDiffViewer oldValue={initialCode} newValue={currentMarkdown} splitView={true} />
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
