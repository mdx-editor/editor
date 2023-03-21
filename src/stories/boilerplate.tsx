/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import React from 'react'
import { SandpackConfig, Wrapper } from '..'
import dataCode from './assets/dataCode.ts?raw'

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

interface WrappedEditorProps {
  markdown: string
}

export const WrappedLexicalEditor: React.FC<WrappedEditorProps> = ({ markdown }) => {
  return <Wrapper markdown={markdown} sandpackConfig={virtuosoSampleSandpackConfig} />
}
