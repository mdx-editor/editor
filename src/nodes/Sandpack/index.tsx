import { SandpackCodeEditor, SandpackLayout, SandpackPreview, SandpackProvider, useSandpack } from '@codesandbox/sandpack-react'
import { CodeMirrorRef } from '@codesandbox/sandpack-react/dist/components/CodeEditor/CodeMirror'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { createCommand, DecoratorNode, EditorConfig, LexicalNode, NodeKey, SerializedLexicalNode, Spread } from 'lexical'
import React, { useContext } from 'react'
import { parseCodeBlockMeta } from './parseCodeBlockMeta'

export interface SandpackPayload {
  code: string
  meta: string
}

export type SerializedSandpackNode = Spread<
  {
    code: string
    meta: string
    type: 'sandpack'
    version: 1
  },
  SerializedLexicalNode
>

type SandpackProviderProps = React.ComponentProps<typeof SandpackProvider>

export type Dependencies = Record<string, string>

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

const DefaultSandpackConfig: SandpackConfig = {
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

export const SandpackConfigContext = React.createContext<SandpackConfig>(DefaultSandpackConfig)

interface CodeUpdateEmitterProps {
  snippetFileName: string
  onChange: (code: string) => void
}

const CodeUpdateEmitter = ({ onChange, snippetFileName }: CodeUpdateEmitterProps) => {
  const { sandpack } = useSandpack()
  onChange(sandpack.files[snippetFileName].code)
  return null
}

export interface ActiveSandpackPayload {
  nodeKey: NodeKey
}

export const ACTIVE_SANDPACK_COMMAND = createCommand<ActiveSandpackPayload | null>('ACTIVE_SANDPACK_COMMAND')

const CodeEditor = ({ nodeKey, code, meta, onChange }: CodeEditorProps) => {
  const [editor] = useLexicalComposerContext()
  const config = useContext(SandpackConfigContext)
  const codeMirrorRef = React.useRef<CodeMirrorRef>(null)
  const metaObj = parseCodeBlockMeta(meta)
  const presetName = metaObj.preset || config.defaultPreset
  const preset = config.presets.find((p) => p.name === presetName)
  if (!preset) {
    throw new Error(`Unknown preset: ${presetName}`)
  }

  const wrappedOnChange = React.useCallback(
    (code: string) => {
      editor.update(() => {
        onChange(code)
      })
    },
    [onChange, editor]
  )

  const onFocusHandler = React.useCallback(() => {
    editor.dispatchCommand(ACTIVE_SANDPACK_COMMAND, { nodeKey })
  }, [editor, nodeKey])

  React.useEffect(() => {
    const codeMirror = codeMirrorRef.current

    // TODO: This is a hack to get around the fact that the CodeMirror instance
    // is not available immediately after the component is mounted. We should we should what?
    setTimeout(() => {
      codeMirror?.getCodemirror()?.contentDOM?.addEventListener('focus', onFocusHandler)
    }, 100)

    return () => {
      codeMirror?.getCodemirror()?.contentDOM.removeEventListener('focus', onFocusHandler)
    }
  }, [codeMirrorRef, onFocusHandler])

  return (
    <SandpackProvider
      template={preset.sandpackTemplate}
      theme={preset.sandpackTheme}
      files={{
        [preset.snippetFileName]: code,
        ...Object.entries(preset.files || {}).reduce(
          (acc, [filePath, fileContents]) => ({ ...acc, ...{ [filePath]: { code: fileContents, readOnly: true } } }),
          {}
        ),
      }}
      customSetup={{
        dependencies: preset.dependencies,
      }}
    >
      <SandpackLayout>
        <SandpackCodeEditor showLineNumbers showInlineErrors ref={codeMirrorRef} />
        <SandpackPreview />
      </SandpackLayout>
      <CodeUpdateEmitter onChange={wrappedOnChange} snippetFileName={preset.snippetFileName} />
    </SandpackProvider>
  )
}

export class SandpackNode extends DecoratorNode<JSX.Element> {
  __code: string
  __meta: string

  static getType(): string {
    return 'sandpack'
  }

  static clone(node: SandpackNode): SandpackNode {
    return new SandpackNode(node.__code, node.__meta, node.__key)
  }

  static importJSON(serializedNode: SerializedSandpackNode): SandpackNode {
    const { code, meta } = serializedNode
    const node = $createSandpackNode({
      code,
      meta,
    })
    return node
  }

  constructor(code: string, meta: string, key?: NodeKey) {
    super(key)
    this.__code = code
    this.__meta = meta
  }

  exportJSON(): SerializedSandpackNode {
    return {
      code: this.getCode(),
      meta: this.getMeta(),
      type: 'sandpack',
      version: 1,
    }
  }

  // View
  createDOM(_config: EditorConfig): HTMLDivElement {
    return document.createElement('div')
  }

  updateDOM(): false {
    return false
  }

  getCode(): string {
    return this.getLatest().__code
  }

  getMeta(): string {
    return this.getLatest().__meta
  }

  setCode(code: string) {
    if (code !== this.__code) {
      this.getWritable().__code = code
    }
  }

  setMeta(meta: string) {
    if (meta !== this.__meta) {
      this.getWritable().__meta = meta
    }
  }

  decorate(): JSX.Element {
    return <CodeEditor nodeKey={this.getKey()} code={this.getCode()} meta={this.getMeta()} onChange={(code) => this.setCode(code)} />
  }
}

interface CodeEditorProps {
  code: string
  nodeKey: string
  meta: string
  onChange: (code: string) => void
}

export function $createSandpackNode({ code, meta }: SandpackPayload): SandpackNode {
  return new SandpackNode(code, meta)
}

export function $isSandpackNode(node: LexicalNode | null | undefined): node is SandpackNode {
  return node instanceof SandpackNode
}
