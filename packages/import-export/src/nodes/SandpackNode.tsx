import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import React from 'react'
import { SandpackCodeEditor, SandpackLayout, SandpackPreview, SandpackProvider, useActiveCode } from '@codesandbox/sandpack-react'
import { DecoratorNode, EditorConfig, LexicalNode, NodeKey, SerializedLexicalNode, Spread } from 'lexical'

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

const CodeUpdateEmitter = ({ onChange }: { onChange: (code: string) => void }) => {
  const { code } = useActiveCode()
  onChange(code)
  return null
}

const CodeEditor = ({ code, meta, onChange }: CodeEditorProps) => {
  const [editor] = useLexicalComposerContext()

  const wrappedOnChange = React.useCallback(
    (code: string) => {
      editor.update(() => {
        onChange(code)
      })
    },
    [onChange]
  )

  return (
    <SandpackProvider
      template="react"
      files={{
        '/App.js': code,
      }}
    >
      <SandpackLayout>
        <SandpackCodeEditor showLineNumbers showInlineErrors />
        <SandpackPreview />
      </SandpackLayout>
      <CodeUpdateEmitter onChange={wrappedOnChange} />
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
    return <CodeEditor code={this.getCode()} meta={this.getMeta()} onChange={(code) => this.setCode(code)} />
  }
}

interface CodeEditorProps {
  code: string
  meta: string
  onChange: (code: string) => void
}

export function $createSandpackNode({ code, meta }: SandpackPayload): SandpackNode {
  return new SandpackNode(code, meta)
}

export function $isSandpackNode(node: LexicalNode | null | undefined): node is SandpackNode {
  return node instanceof SandpackNode
}
