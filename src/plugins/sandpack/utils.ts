import { SandpackProvider } from '@codesandbox/sandpack-react'

type SandpackProviderProps = React.ComponentProps<typeof SandpackProvider>

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
