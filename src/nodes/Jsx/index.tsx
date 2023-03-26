/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  $getRoot,
  createEditor,
  LexicalEditor,
  LexicalNode,
  NodeKey,
  ParagraphNode,
  SerializedEditorState,
  SerializedLexicalNode,
  SerializedParagraphNode,
  SerializedRootNode,
  Spread,
} from 'lexical'
import React from 'react'

import { DecoratorNode } from 'lexical'
import { MdxJsxAttribute } from 'mdast-util-mdx'
import { ReactComponent as SettingsIcon } from './icons/settings.svg'
// import { ReactComponent as ExtensionIcon } from './icons/extension.svg'
import * as styles from './styles.css'
import * as RadixPopover from '@radix-ui/react-popover'
import { PopoverContent, PopoverTrigger } from '../../ui/Popover/primitives'
import { LexicalNestedComposer } from '@lexical/react/LexicalNestedComposer'
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { contentTheme } from '../../'

type JsxKind = 'text' | 'flow'
export interface JsxPayload {
  name: string
  kind: JsxKind
  attributes: Array<MdxJsxAttribute>
  state?: SerializedEditorState
  updateFn?: (node: ParagraphNode) => void
}

export type SerializedJsxNode = Spread<
  {
    name: string
    kind: JsxKind
    attributes: Array<MdxJsxAttribute>
    state?: SerializedEditorState
    type: 'jsx'
    version: 1
  },
  SerializedLexicalNode
>

interface JsxNodeConstructorParams {
  name: string
  kind: JsxKind
  attributes: Array<MdxJsxAttribute>
  state?: SerializedEditorState
  key?: NodeKey
  updateFn?: (node: ParagraphNode) => void
}

export class JsxNode extends DecoratorNode<JSX.Element> {
  __kind: JsxKind
  __name: string
  __attributes: Array<MdxJsxAttribute>
  __editor: LexicalEditor

  static getType(): string {
    return 'jsx'
  }

  static clone(node: JsxNode): JsxNode {
    return new JsxNode({
      name: node.__name,
      kind: node.__kind,
      attributes: node.__attributes,
      state: node.__editor.getEditorState().toJSON(),
    })
  }

  static importJSON(serializedNode: SerializedJsxNode): JsxNode {
    const { name, kind, attributes, state } = serializedNode
    const node = $createJsxNode({
      kind,
      name,
      attributes,
      state,
    })
    return node
  }

  constructor({ name, kind, attributes, state, updateFn, key }: JsxNodeConstructorParams) {
    super(key)
    if (!attributes) {
      debugger
    }
    this.__name = name
    this.__kind = kind
    this.__attributes = attributes
    this.__editor = createEditor()
    if (state) {
      const parsedState = this.__editor.parseEditorState(state)
      if (!parsedState.isEmpty()) {
        this.__editor.setEditorState(parsedState)
      }
    } else if (updateFn) {
      const json = {
        type: 'root',
        format: 'left',
        indent: 0,
        direction: 'ltr',
        version: 1,
        children: [
          {
            type: 'paragraph',
            version: 1,
            direction: 'ltr',
            format: 'left',
            indent: 0,
            children: [],
          } as SerializedParagraphNode,
        ],
      } as SerializedRootNode

      const parsedState = this.__editor.parseEditorState({ root: json }, () => {
        const rootParagraph: ParagraphNode = $getRoot().getFirstChildOrThrow()
        updateFn(rootParagraph)
      })
      if (!parsedState.isEmpty()) {
        this.__editor.setEditorState(parsedState)
      }
    }
  }

  exportJSON(): SerializedJsxNode {
    return {
      name: this.getName(),
      kind: this.getKind(),
      attributes: this.getAttributes(),
      state: this.__editor.getEditorState().toJSON(),
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
        <span>
          {this.getName()}

          <LexicalNestedComposer initialEditor={this.__editor} initialTheme={contentTheme}>
            <RichTextPlugin
              contentEditable={<ContentEditable style={{ padding: 5, border: '1px solid red' }} />}
              placeholder={<div>Type here..</div>}
              ErrorBoundary={LexicalErrorBoundary}
            />
          </LexicalNestedComposer>
        </span>
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

export function $createJsxNode(payload: JsxPayload): JsxNode {
  return new JsxNode(payload)
}

export function $isJsxNode(node: LexicalNode | null | undefined): node is JsxNode {
  return node instanceof JsxNode
}
