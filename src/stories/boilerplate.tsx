/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { registerCodeHighlighting } from '@lexical/code'
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary'
import { HorizontalRulePlugin } from '@lexical/react/LexicalHorizontalRulePlugin'
import { LinkPlugin as LexicalLinkPlugin } from '@lexical/react/LexicalLinkPlugin'
import { ListPlugin } from '@lexical/react/LexicalListPlugin'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { $getRoot, EditorState } from 'lexical'
import React from 'react'
import {
  contentTheme,
  exportMarkdownFromLexical,
  importMarkdownToLexical,
  SandpackConfig,
  SandpackConfigContext,
  UsedLexicalNodes,
} from '..'
import { LinkDialogPlugin, ToolbarPlugin } from '../'
import { ViewModeContextProvider, ViewModeToggler } from '../ui/SourcePlugin'
import dataCode from './assets/dataCode.ts?raw'

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
export const virtuosoSampleSandpackConfig: SandpackConfig = {
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

export function CodeHighlightPlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext()

  React.useEffect(() => {
    return registerCodeHighlighting(editor)
  }, [editor])

  return null
}

interface WrappedEditorProps {
  markdown: string
}

export const WrappedLexicalEditor: React.FC<WrappedEditorProps> = ({ markdown }) => {
  return (
    <SandpackConfigContext.Provider value={virtuosoSampleSandpackConfig}>
      <LexicalComposer initialConfig={standardConfig(markdown)}>
        <ViewModeContextProvider>
          <ToolbarPlugin />
          <ViewModeToggler initialCode={markdown}>
            <RichTextPlugin contentEditable={<ContentEditable />} placeholder={<div></div>} ErrorBoundary={LexicalErrorBoundary} />
          </ViewModeToggler>
          <LexicalLinkPlugin />
          <CodeHighlightPlugin />
          <HorizontalRulePlugin />
          <ListPlugin />
          <LinkDialogPlugin />
        </ViewModeContextProvider>
      </LexicalComposer>
    </SandpackConfigContext.Provider>
  )
}
