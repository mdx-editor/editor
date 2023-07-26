import { DecoratorNode, EditorConfig, LexicalEditor, LexicalNode, NodeKey, SerializedLexicalNode, Spread } from 'lexical'
import React from 'react'
import { noop } from '../../utils/fp'
import { CodeBlockEditorContainer } from './CodeBlockEditorContainer'
/**
 * The options necessary to construct a {@link CodeBlockNode}.
 */
export interface CreateCodeBlockNodeOptions {
  /**
   * The code contents of the block.
   */
  code: string
  /**
   * The language of the code block (i.e. `js`, `jsx`, etc.). This is used for syntax highlighting.
   */
  language: string
  /**
   * The additional meta data of the block.
   */
  meta: string
}

/**
 * A serialized representation of an {@link CodeBlockNode}.
 */
export type SerializedCodeBlockNode = Spread<CreateCodeBlockNodeOptions & { type: 'codeblock'; version: 1 }, SerializedLexicalNode>

function voidEmitter() {
  let subscription = noop
  return {
    publish: () => {
      subscription()
    },
    subscribe: (cb: () => void) => {
      subscription = cb
    }
  }
}

/**
 * A lexical node that represents a fenced code block. Use {@link "$createCodeBlockNode"} to construct one.
 */
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
      meta
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
      type: 'codeblock',
      version: 1
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

  setCode = (code: string) => {
    if (code !== this.__code) {
      this.getWritable().__code = code
    }
  }

  setMeta = (meta: string) => {
    if (meta !== this.__meta) {
      this.getWritable().__meta = meta
    }
  }

  setLanguage = (language: string) => {
    if (language !== this.__language) {
      this.getWritable().__language = language
    }
  }

  select = () => {
    this.__focusEmitter.publish()
  }

  decorate(editor: LexicalEditor): JSX.Element {
    return (
      <CodeBlockEditorContainer
        parentEditor={editor}
        code={this.getCode()}
        meta={this.getMeta()}
        language={this.getLanguage()}
        codeBlockNode={this}
        nodeKey={this.getKey()}
        focusEmitter={this.__focusEmitter}
      />
    )
  }
}

/**
 * Creates a {@link CodeBlockNode}.
 * @param options - The code contents, the language  (i.e. js, jsx, etc.), and the additional meta data of the block.
 */
export function $createCodeBlockNode(options: CreateCodeBlockNodeOptions): CodeBlockNode {
  const { code, language, meta } = options
  return new CodeBlockNode(code, language, meta)
}

/**
 * Returns true if the given node is a {@link CodeBlockNode}.
 */
export function $isCodeBlockNode(node: LexicalNode | null | undefined): node is CodeBlockNode {
  return node instanceof CodeBlockNode
}
