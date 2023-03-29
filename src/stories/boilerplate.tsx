/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import React from 'react'
import { AvailableJsxImports, SandpackConfig, Wrapper } from '..'
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

const availableImports: AvailableJsxImports = [{ source: './external', componentNames: ['MyLeaf', 'BlockNode'] }]

interface WrappedEditorProps {
  markdown: string
}

export const WrappedLexicalEditor: React.FC<WrappedEditorProps> = ({ markdown }) => {
  return <Wrapper markdown={markdown} sandpackConfig={virtuosoSampleSandpackConfig} availableJsxImports={availableImports} />
}
