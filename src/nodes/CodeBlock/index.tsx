import { DecoratorNode, EditorConfig, LexicalNode, NodeKey, SerializedLexicalNode, Spread } from 'lexical'
import React from 'react'
import { useEmitterValues } from '../../system'
import { noop } from '../../utils/fp'
import { CodeBlockEditorProps } from '../../types/NodeDecoratorsProps'

export interface CodeBlockPayload {
  code: string
  meta: string
  language: string
}

export type SerializedCodeBlockNode = Spread<CodeBlockPayload & { type: 'sandpack'; version: 1 }, SerializedLexicalNode>

function voidEmitter() {
  let subscription = noop
  return {
    publish: () => {
      subscription()
    },
    subscribe: (cb: () => void) => {
      subscription = cb
    },
  }
}

function InternalCodeBlockEditor(props: CodeBlockEditorProps) {
  const [{ CodeBlockEditor }] = useEmitterValues('nodeDecorators')
  return <CodeBlockEditor {...props} />
}

export class CodeBlockNode extends DecoratorNode<JSX.Element> {
  __code: string
  __meta: string
  __language: string
  __focusEmitter = voidEmitter()

  static getType(): string {
    return 'codeblock'
  }

  static clone(node: CodeBlockNode): CodeBlockNode {
    return new CodeBlockNode(node.__code, node.__language, node.__meta, node.__key)
  }

  static importJSON(serializedNode: SerializedCodeBlockNode): CodeBlockNode {
    const { code, meta, language } = serializedNode
    return $createCodeBlockNode({
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

  exportJSON(): SerializedCodeBlockNode {
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

  select() {
    this.__focusEmitter.publish()
  }

  decorate(): JSX.Element {
    return (
      <InternalCodeBlockEditor
        nodeKey={this.getKey()}
        code={this.getCode()}
        meta={this.getMeta()}
        language={this.getLanguage()}
        onChange={(code) => this.setCode(code)}
        focusEmitter={this.__focusEmitter}
      />
    )
  }
}

export function $createCodeBlockNode({ code, language, meta }: CodeBlockPayload): CodeBlockNode {
  return new CodeBlockNode(code, language, meta)
}

export function $isCodeBlockNode(node: LexicalNode | null | undefined): node is CodeBlockNode {
  return node instanceof CodeBlockNode
}
