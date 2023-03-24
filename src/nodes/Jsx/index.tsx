import React from 'react'
import type {
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  EditorConfig,
  LexicalEditor,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
  Spread,
} from 'lexical'

import { DecoratorNode } from 'lexical'
import { MdxJsxAttribute } from 'mdast-util-mdx'

type JsxKind = 'text' | 'flow'
export interface JsxPayload {
  name: string
  kind: JsxKind
  attributes: Array<MdxJsxAttribute>
}

export type SerializedJsxNode = Spread<
  {
    name: string
    kind: JsxKind
    attributes: Array<MdxJsxAttribute>
    type: 'jsx'
    version: 1
  },
  SerializedLexicalNode
>

export class JsxNode extends DecoratorNode<JSX.Element> {
  __kind: JsxKind
  __name: string
  __attributes: Array<MdxJsxAttribute>

  static getType(): string {
    return 'jsx'
  }

  static clone(node: JsxNode): JsxNode {
    return new JsxNode(node.__name, node.__kind, node.__attributes)
  }

  static importJSON(serializedNode: SerializedJsxNode): JsxNode {
    const { name, kind, attributes } = serializedNode
    const node = $createJsxNode({
      kind,
      name,
      attributes,
    })
    return node
  }

  constructor(name: string, kind: JsxKind, attributes: Array<MdxJsxAttribute>, key?: NodeKey) {
    super(key)
    if (!attributes) {
      debugger
    }
    console.log('q', attributes)
    this.__name = name
    this.__kind = kind
    this.__attributes = attributes
  }

  exportJSON(): SerializedJsxNode {
    return {
      name: this.getName(),
      kind: this.getKind(),
      attributes: this.getAttributes(),
      type: 'jsx',
      version: 1,
    }
  }

  createDOM(): HTMLElement {
    if (this.getKey() === 'flow') {
      return document.createElement('div')
    } else {
      return document.createElement('span')
    }
  }

  updateDOM(): false {
    return false
  }

  getName() {
    return this.__name
  }

  getKind() {
    return this.__kind
  }

  getAttributes() {
    return this.__attributes
  }

  decorate(): JSX.Element {
    if (this.getKey() === 'flow') {
      return (
        <div>
          Flow -{this.getName()} - {JSON.stringify(this.getAttributes())}
        </div>
      )
    }
    return (
      <code>
        {this.getName()} - {JSON.stringify(this.getAttributes())}
      </code>
    )
  }
}

export function $createJsxNode({ name, kind, attributes }: JsxPayload): JsxNode {
  return new JsxNode(name, kind, attributes)
}

export function $isJsxNode(node: LexicalNode | null | undefined): node is JsxNode {
  return node instanceof JsxNode
}
