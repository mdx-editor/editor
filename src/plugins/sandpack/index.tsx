import { SandpackProvider } from '@codesandbox/sandpack-react'
import React, { JSX } from 'react'
import { CodeBlockEditorDescriptor, appendCodeBlockEditorDescriptor$, insertCodeBlock$ } from '../codeblock'
import { SandpackEditor } from './SandpackEditor'
import { Cell, Signal, map, useCellValue, withLatestFrom } from '@mdxeditor/gurx'
import { realmPlugin } from '../../RealmWithPlugins'

type SandpackProviderProps = React.ComponentProps<typeof SandpackProvider>

/**
 * Defines a single preset that can be used to create a Sandpack sandbox.
 * @group Sandpack
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
 * @group Sandpack
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
 * Holds the current sandpack configuration.
 * @group Sandpack
 */
export const sandpackConfig$ = Cell<SandpackConfig>(defaultSandpackConfig)

/**
 * A signal that inserts a new sandpack code block with the specified name from the {@link SandpackConfig}.
 * If no name is specified, the default preset will be used.
 * @group Sandpack
 */
export const insertSandpack$ = Signal<string>((r) => {
  r.link(
    r.pipe(
      insertSandpack$,
      withLatestFrom(sandpackConfig$),
      map(([presetName, sandpackConfig]) => {
        const preset = presetName
          ? sandpackConfig.presets.find((preset) => preset.name === presetName)
          : sandpackConfig.presets.find((preset) => preset.name == sandpackConfig.defaultPreset)
        if (!preset) {
          throw new Error(`No sandpack preset found with name ${presetName}`)
        }

        return {
          code: preset.initialSnippetContent ?? '',
          language: preset.snippetLanguage ?? 'jsx',
          meta: preset.meta
        }
      })
    ),
    insertCodeBlock$
  )
})

/**
 * A plugin that adds support for sandpack code blocks in the editor.
 * @group Sandpack
 */
export const sandpackPlugin = realmPlugin<{ sandpackConfig: SandpackConfig }>({
  init(realm, params) {
    realm.pubIn({
      [sandpackConfig$]: params?.sandpackConfig,
      [appendCodeBlockEditorDescriptor$]: sandpackCodeBlockDescriptor()
    })
  },
  update(realm, params) {
    realm.pub(sandpackConfig$, params?.sandpackConfig)
  }
})

function sandpackCodeBlockDescriptor(): CodeBlockEditorDescriptor {
  return {
    match(_language, meta) {
      return Boolean(meta?.startsWith('live'))
    },
    Editor(props) {
      const config = useCellValue(sandpackConfig$)

      const preset = config.presets.find((preset) => preset.meta === props.meta)
      if (!preset) {
        throw new Error(`No sandpack preset found with ${props.meta}`)
      }

      return <SandpackEditor {...props} preset={preset} />
    },
    priority: 1
  }
}
