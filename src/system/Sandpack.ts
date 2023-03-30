import { system } from '../gurx'
import { COMMAND_PRIORITY_LOW, FOCUS_COMMAND } from 'lexical'
import { EditorSystemType } from './Editor'
import React from 'react'
import { SandpackProvider } from '@codesandbox/sandpack-react'
import { CodeBlockMeta } from '../nodes/Sandpack/parseCodeBlockMeta'

export type Dependencies = Record<string, string>
type SandpackProviderProps = React.ComponentProps<typeof SandpackProvider>

export type DependencySet = {
  name: string
  dependencies: Dependencies
}

export type FileSet = {
  name: string
  files: Record<string, string>
}

export interface SandpackPreset {
  name: string
  sandpackTemplate: SandpackProviderProps['template']
  sandpackTheme: SandpackProviderProps['theme']
  snippetFileName: string
  dependencies?: Dependencies
  files?: Record<string, string>
  additionalDependencySets?: Array<DependencySet>
  additionalFileSets?: Array<FileSet>
}

export interface SandpackConfig {
  defaultPreset: string
  presets: Array<SandpackPreset>
}

export type SandpackConfigValue = SandpackConfig | ((meta: CodeBlockMeta) => SandpackPreset)

const defaultSandpackConfig: SandpackConfig = {
  defaultPreset: 'react',
  presets: [
    {
      name: 'react',
      sandpackTemplate: 'react',
      sandpackTheme: 'light',
      snippetFileName: '/App.js',
    },
  ],
}
export const [SandpackSystem] = system(
  (r, [{ createEditorSubscription }]) => {
    const activeSandpackNode = r.node<{ nodeKey: string } | null>(null)
    const sandpackConfig = r.node<SandpackConfigValue>(defaultSandpackConfig)

    // clear the node when the regular editor is focused.
    r.pub(createEditorSubscription, (editor) => {
      return editor.registerCommand(
        FOCUS_COMMAND,
        () => {
          r.pub(activeSandpackNode, null)
          return false
        },
        COMMAND_PRIORITY_LOW
      )
    })

    return {
      activeSandpackNode,
      sandpackConfig,
    }
  },
  [EditorSystemType]
)
