/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import React from 'react'
import { JsxComponentDescriptors, SandpackConfig, ViewMode, MDXEditor } from '../index'
import dataCode from './assets/dataCode.ts?raw'

const defaultSnippetContent = `
export default function App() {
  return (
    <div className="App">
      <h1>Hello CodeSandbox</h1>
      <h2>Start editing to see some magic happen!</h2>
    </div>
  );
}
`.trim()

export const virtuosoSampleSandpackConfig: SandpackConfig = {
  defaultPreset: 'react',
  presets: [
    {
      label: 'React',
      name: 'react',
      meta: 'live react',
      sandpackTemplate: 'react',
      sandpackTheme: 'light',
      snippetFileName: '/App.js',
      defaultSnippetLanguage: 'jsx',
      defaultSnippetContent,
    },
    {
      label: 'Virtuoso',
      name: 'virtuoso',
      meta: 'live virtuoso',
      sandpackTemplate: 'react-ts',
      sandpackTheme: 'light',
      snippetFileName: '/App.tsx',
      defaultSnippetContent,
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

export const jsxDescriptors: JsxComponentDescriptors = [
  {
    name: 'MyLeaf',
    kind: 'text',
    source: './external',
    props: [
      { name: 'foo', type: 'string' },
      { name: 'bar', type: 'string' },
    ],
  },
  {
    name: 'BlockNode',
    kind: 'flow',
    source: './external',
    props: [],
  },
]

interface WrappedEditorProps {
  markdown: string
  onChange?: (markdown: string) => void
  viewMode?: ViewMode
  className?: string
}

export const WrappedLexicalEditor: React.FC<WrappedEditorProps> = ({ viewMode, markdown, onChange, className }) => {
  return (
    <MDXEditor
      markdown={markdown}
      viewMode={viewMode}
      headMarkdown={markdown}
      sandpackConfig={virtuosoSampleSandpackConfig}
      jsxComponentDescriptors={jsxDescriptors}
      className={className}
      onChange={onChange}
      linkAutocompleteSuggestions={['https://google.com/', 'https://news.ycombinator.com/', 'https://reddit.com/']}
    />
  )
}
