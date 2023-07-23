import 'mdast-util-directive'
import { SandpackProvider } from '@codesandbox/sandpack-react'
import { $insertNodeToNearestRoot } from '@lexical/utils'
import { $getSelection, $isRangeSelection, COMMAND_PRIORITY_LOW, FOCUS_COMMAND } from 'lexical'
import React from 'react'
import { system } from '../gurx'
import { $createCodeBlockNode, $createSandpackNode } from '../nodes'
import { EditorSystem } from './Editor'

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
  label: string
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

const defaultCodeBlockLanguages = {
  js: 'JavaScript',
  ts: 'TypeScript',
  tsx: 'TypeScript (React)',
  jsx: 'JavaScript (React)',
  css: 'CSS'
}

export const SandpackSystem = system(
  (r, [{ activeEditor, activeEditorType, createEditorSubscription }]) => {
    const sandpackConfig = r.node<SandpackConfig>(defaultSandpackConfig)
    const codeBlockLanguages = r.node(defaultCodeBlockLanguages)
    const insertSandpack = r.node<string>()
    const insertCodeBlock = r.node<true>()

    // clear the node when the regular editor is focused.
    r.pub(createEditorSubscription, (editor) => {
      return editor.registerCommand(
        FOCUS_COMMAND,
        () => {
          r.pub(activeEditorType, { type: 'lexical' })
          return false
        },
        COMMAND_PRIORITY_LOW
      )
    })

    r.sub(r.pipe(insertSandpack, r.o.withLatestFrom(activeEditor, sandpackConfig)), ([meta, theEditor, sandpackConfig]) => {
      theEditor?.getEditorState().read(() => {
        const selection = $getSelection()

        if ($isRangeSelection(selection)) {
          const focusNode = selection.focus.getNode()

          const preset = meta
            ? sandpackConfig.presets.find((preset) => preset.meta === meta)
            : sandpackConfig.presets.find((preset) => preset.name == sandpackConfig.defaultPreset)
          if (!preset) {
            throw new Error(`No sandpack preset found with ${meta}`)
          }

          if (focusNode !== null) {
            theEditor.update(() => {
              const sandpackNode = $createSandpackNode({
                code: preset.initialSnippetContent || '',
                language: preset.snippetLanguage || 'jsx',
                meta: preset.meta
              })

              $insertNodeToNearestRoot(sandpackNode)
              // TODO: hack, decoration is not synchronous ;(
              setTimeout(() => sandpackNode.select(), 80)
            })
          }
        }
      })
    })

    r.sub(r.pipe(insertCodeBlock, r.o.withLatestFrom(activeEditor)), ([, theEditor]) => {
      theEditor?.getEditorState().read(() => {
        const selection = $getSelection()

        if ($isRangeSelection(selection)) {
          const focusNode = selection.focus.getNode()

          if (focusNode !== null) {
            theEditor.update(() => {
              const codeBlockNode = $createCodeBlockNode({
                code: '',
                language: 'jsx',
                meta: ''
              })

              $insertNodeToNearestRoot(codeBlockNode)
              // TODO: hack, decoration is not synchronous ;(
              setTimeout(() => codeBlockNode.select(), 80)
            })
          }
        }
      })
    })

    return {
      codeBlockLanguages,
      insertSandpack,
      insertCodeBlock,
      sandpackConfig
    }
  },
  [EditorSystem]
)
