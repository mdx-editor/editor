import { SandpackCodeEditor, SandpackLayout, SandpackPreview, SandpackProvider, useSandpack } from '@codesandbox/sandpack-react'
import { CodeMirrorRef } from '@codesandbox/sandpack-react/dist/components/CodeEditor/CodeMirror'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import {
  $createParagraphNode,
  $getNodeByKey,
  DecoratorNode,
  EditorConfig,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
  Spread,
} from 'lexical'
import React, { useContext } from 'react'
import { CodeBlockMeta, parseCodeBlockMeta } from './parseCodeBlockMeta'
import { usePublisher } from '../../ui'

export type { CodeBlockMeta } from './parseCodeBlockMeta'

export interface SandpackPayload {
  code: string
  meta: string
  language: string
}

export type SerializedSandpackNode = Spread<
  {
    code: string
    meta: string
    language: string
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

export type SandpackConfigValue = SandpackConfig | ((meta: CodeBlockMeta) => SandpackPreset)

export const SandpackConfigContext = React.createContext<SandpackConfigValue>(DefaultSandpackConfig)

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

const CodeEditor = ({ nodeKey, code, meta, onChange }: CodeEditorProps) => {
  const [editor] = useLexicalComposerContext()
  const setActiveSandpackNode = usePublisher('activeSandpackNode')
  const codeMirrorRef = React.useRef<CodeMirrorRef>(null)

  let preset: SandpackPreset | undefined
  const config = useContext(SandpackConfigContext)
  const metaObj = parseCodeBlockMeta(meta)
  if (typeof config === 'function') {
    preset = config(metaObj)
  } else {
    const presetName = metaObj.preset || config.defaultPreset
    preset = config.presets.find((p) => p.name === presetName)
    if (!preset) {
      throw new Error(`No preset found for name ${presetName}`)
    }
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
    setActiveSandpackNode({ nodeKey })
  }, [nodeKey, setActiveSandpackNode])

  const onKeyDownHandler = React.useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        const state = codeMirrorRef?.current?.getCodemirror()?.state
        if (state) {
          const docLength = state.doc.length
          const selectionEnd = state.selection.ranges[0].to

          if (docLength === selectionEnd) {
            editor.update(() => {
              const node = $getNodeByKey(nodeKey)!
              const nextSibling = node.getNextSibling()
              if (nextSibling) {
                codeMirrorRef?.current?.getCodemirror()?.contentDOM.blur()
                node.selectNext()
              } else {
                node.insertAfter($createParagraphNode())
              }
            })
          }
        }
      } else if (e.key === 'ArrowUp') {
        const state = codeMirrorRef?.current?.getCodemirror()?.state
        if (state) {
          const selectionStart = state.selection.ranges[0].from

          if (selectionStart === 0) {
            editor.update(() => {
              const node = $getNodeByKey(nodeKey)!
              const previousSibling = node.getPreviousSibling()
              if (previousSibling) {
                codeMirrorRef?.current?.getCodemirror()?.contentDOM.blur()
                node.selectPrevious()
              } else {
                // TODO: insert a paragraph before the sandpack node
              }
            })
          }
        }
      }
    },
    [editor, nodeKey]
  )

  React.useEffect(() => {
    const codeMirror = codeMirrorRef.current

    // TODO: This is a hack to get around the fact that the CodeMirror instance
    // is not available immediately after the component is mounted.
    setTimeout(() => {
      codeMirror?.getCodemirror()?.contentDOM?.addEventListener('focus', onFocusHandler)
      codeMirror?.getCodemirror()?.contentDOM?.addEventListener('keydown', onKeyDownHandler)
    }, 100)

    return () => {
      codeMirror?.getCodemirror()?.contentDOM.removeEventListener('focus', onFocusHandler)
      codeMirror?.getCodemirror()?.contentDOM.removeEventListener('keydown', onKeyDownHandler)
    }
  }, [codeMirrorRef, onFocusHandler, onKeyDownHandler])

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
  __language: string

  static getType(): string {
    return 'sandpack'
  }

  static clone(node: SandpackNode): SandpackNode {
    return new SandpackNode(node.__code, node.__language, node.__meta, node.__key)
  }

  static importJSON(serializedNode: SerializedSandpackNode): SandpackNode {
    const { code, meta, language } = serializedNode
    return $createSandpackNode({
      code,
      language,
      meta,
    })
  }

  constructor(code: string, language: string, meta: string, key?: NodeKey) {
    super(key)
    this.__code = code
    this.__meta = meta
    this.__language = language
  }

  exportJSON(): SerializedSandpackNode {
    return {
      code: this.getCode(),
      language: this.getLanguage(),
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

  getLanguage(): string {
    return this.getLatest().__language
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

  setLanguage(language: string) {
    if (language !== this.__language) {
      this.getWritable().__language = language
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

export function $createSandpackNode({ code, language, meta }: SandpackPayload): SandpackNode {
  return new SandpackNode(code, language, meta)
}

export function $isSandpackNode(node: LexicalNode | null | undefined): node is SandpackNode {
  return node instanceof SandpackNode
}
