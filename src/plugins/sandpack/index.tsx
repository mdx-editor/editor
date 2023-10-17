import { SandpackProvider } from '@codesandbox/sandpack-react'
import React from 'react'
import { realmPlugin, system } from '../../gurx'
import { coreSystem } from '../core'
import { codeBlockSystem } from '../codeblock'
import { SandpackEditor } from './SandpackEditor'

type SandpackProviderProps = React.ComponentProps<typeof SandpackProvider>

/**
 * Defines a single preset that can be used to create a sandbox.
 */
export interface SandpackPreset {
  /**
   * The name of the preset - use this to reference the preset from the defaultPreset field.
   */
  name: string
  /**
   * The label of the preset, displayed in the sandpack button dropdown.
   */
  label: string | JSX.Element
  /**
   * The meta string that will be used to identify the preset from the fenced code block. e.g. "live react"
   */
  meta: string
  /**
   * The sandpack template that will be used to create the sandbox. e.g. "react", "react-ts", "vanilla".
   */
  sandpackTemplate: SandpackProviderProps['template']
  /**
   * The sandpack theme that will be used to create the sandbox. e.g. "light", "dark".
   */
  sandpackTheme: SandpackProviderProps['theme']
  /**
   * The name of the file that will be created in the sandbox. e.g. "/App.js".
   */
  snippetFileName: string
  /**
   * The dependencies that will be added to the sandbox, just like in package.json.
   */
  dependencies?: Record<string, string>
  /**
   * The files that will be added to the sandbox (read-only).
   * The key is the name of the file, and the value is the contents of the file.
   */
  files?: Record<string, string>
  /**
   * The language used in the editable snippet. e.g. "jsx", "tsx", etc.
   */
  snippetLanguage?: string
  /**
   * The initial content of the editable snippet.
   */
  initialSnippetContent?: string
}

/**
 * The configuration for the available sandpack presets.
 */
export interface SandpackConfig {
  /**
   * The name of the default preset that will be used if no meta (other than live) is set.
   */
  defaultPreset: string
  /**
   * The list of sandpack presets that can be used.
   */
  presets: SandpackPreset[]
}

const defaultSnippetContent = `
export default function App() {
  return (
    <div className="App">
      <h1>Hello CodeSandbox</h1>
      <h2>Start editing to see some magic happen!</h2>
    </div>
  );
}
`

const defaultSandpackConfig: SandpackConfig = {
  defaultPreset: 'react',
  presets: [
    {
      name: 'react',
      meta: 'live react',
      label: 'React',
      sandpackTemplate: 'react',
      sandpackTheme: 'light',
      snippetFileName: '/App.js',
      snippetLanguage: 'jsx',
      initialSnippetContent: defaultSnippetContent
    }
  ]
}

/**
 * @internal
 */
export const sandpackSystem = system(
  (r, [, { insertCodeBlock }]) => {
    const sandpackConfig = r.node<SandpackConfig>(defaultSandpackConfig)
    const insertSandpack = r.node<string>()

    r.link(
      r.pipe(
        insertSandpack,
        r.o.withLatestFrom(sandpackConfig),
        r.o.map(([presetName, sandpackConfig]) => {
          const preset = presetName
            ? sandpackConfig.presets.find((preset) => preset.name === presetName)
            : sandpackConfig.presets.find((preset) => preset.name == sandpackConfig.defaultPreset)
          if (!preset) {
            throw new Error(`No sandpack preset found with name ${presetName}`)
          }

          return {
            code: preset.initialSnippetContent || '',
            language: preset.snippetLanguage || 'jsx',
            meta: preset.meta
          }
        })
      ),
      insertCodeBlock
    )

    return {
      insertSandpack,
      sandpackConfig
    }
  },
  [coreSystem, codeBlockSystem]
)

export const [
  /** @internal */
  sandpackPlugin,
  /** @internal */
  sandpackPluginHooks
] = realmPlugin({
  id: 'sandpack',
  systemSpec: sandpackSystem,
  applyParamsToSystem(r, params: { sandpackConfig: SandpackConfig }) {
    r.pubKey('sandpackConfig', params.sandpackConfig)
  },

  init(r) {
    r.pubKey('appendCodeBlockEditorDescriptor', {
      match(_language, meta) {
        return meta?.startsWith('live')
      },
      priority: 1,
      Editor(props) {
        const [config] = sandpackPluginHooks.useEmitterValues('sandpackConfig')

        const preset = config.presets.find((preset) => preset.meta === props.meta)
        if (!preset) {
          throw new Error(`No sandpack preset found with ${props.meta}`)
        }

        return <SandpackEditor {...props} preset={preset} />
      }
    })
  }
})
