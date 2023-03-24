import type { LexicalNode, NodeKey, SerializedLexicalNode, Spread } from 'lexical'
import React from 'react'

import { DecoratorNode } from 'lexical'
import { MdxJsxAttribute } from 'mdast-util-mdx'
import { ReactComponent as SettingsIcon } from './icons/settings.svg'
// import { ReactComponent as ExtensionIcon } from './icons/extension.svg'
import * as styles from './styles.css'
import * as RadixPopover from '@radix-ui/react-popover'
import { PopoverContent, PopoverTrigger } from '../../ui/Popover/primitives'

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
    if (this.getKind() === 'flow') {
      return (
        <div className={styles.blockComponent}>
          <div>{this.getName()}</div>
          <JsxPropertyPanel attributes={this.getAttributes()} />
        </div>
      )
    }
    return (
      <span className={styles.inlineComponent}>
        <span>
          <RadixPopover.Root>
            <PopoverTrigger>
              <SettingsIcon />
            </PopoverTrigger>
            <RadixPopover.Portal>
              <PopoverContent>
                <JsxPropertyPanel attributes={this.getAttributes()} />
              </PopoverContent>
            </RadixPopover.Portal>
          </RadixPopover.Root>
        </span>
        <span>{this.getName()}</span>
      </span>
    )
  }
}

interface JsxPropertyPanelProps {
  attributes: Array<MdxJsxAttribute>
}

const JsxPropertyPanel: React.FC<JsxPropertyPanelProps> = ({ attributes }) => {
  // iterate over the attributes and render a two column table with the name and value
  return (
    <table>
      <thead>
        <tr>
          <th>Attribute</th>
          <th>Value</th>
        </tr>
      </thead>
      <tbody>
        {attributes.map((attribute) => (
          <tr key={attribute.name}>
            <td>{attribute.name}</td>
            <td>{attribute.value as any}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export function $createJsxNode({ name, kind, attributes }: JsxPayload): JsxNode {
  return new JsxNode(name, kind, attributes)
}

export function $isJsxNode(node: LexicalNode | null | undefined): node is JsxNode {
  return node instanceof JsxNode
}
