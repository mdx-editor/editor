/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import React from 'react'
import { JsxComponentDescriptors, SandpackConfig, Wrapper } from '..'
import dataCode from './assets/dataCode.ts?raw'

const virtuosoSampleSandpackConfig: SandpackConfig = {
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

const jsxDescriptors: JsxComponentDescriptors = [
  {
    name: 'MyLeaf',
    kind: 'text',
    source: './external',
    props: [],
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
}

export const WrappedLexicalEditor: React.FC<WrappedEditorProps> = ({ markdown }) => {
  return <Wrapper markdown={markdown} sandpackConfig={virtuosoSampleSandpackConfig} jsxComponentDescriptors={jsxDescriptors} />
}
