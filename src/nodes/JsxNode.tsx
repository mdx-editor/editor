/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  $getRoot,
  createEditor,
  DecoratorNode,
  LexicalEditor,
  LexicalNode,
  NodeKey,
  ParagraphNode,
  SerializedEditorState,
  SerializedLexicalNode,
  SerializedParagraphNode,
  SerializedRootNode,
  Spread
} from 'lexical'
import { MdxJsxAttribute } from 'mdast-util-mdx-jsx'
import React from 'react'
import { theme as contentTheme } from '../content/theme'
import { JsxKind } from '../types/NodeDecoratorsProps'
import { ExtendedEditorConfig } from '../types/ExtendedEditorConfig'

export type updateFn = (node: LexicalNode) => void

/**
 * The payload to create a {@link JsxNode}.
 */
export interface CreateJsxNodeOptions {
  /**
   * The name of the JSX element.
   */
  name: string
  /**
   * The type of the element - markdown makes a distinction between text and flow elements.
   */
  kind: JsxKind
  /**
   * The attributes of the JSX element.
   */
  attributes: Array<MdxJsxAttribute>
  /**
   * The tree state of the children.
   */
  state?: SerializedEditorState
  /**
   * If passed, this function will be called with the root paragraph node of the editor.
   */
  updateFn?: updateFn
}

/**
 * A serialized representation of a {@link JsxNode}.
 */
export type SerializedJsxNode = Spread<
  Omit<CreateJsxNodeOptions, 'updateFn'> & {
    version: 1
    type: 'jsx'
  },
  SerializedLexicalNode
>

/**
 * The parameters of the {@link JsxNode} constructor.
 */
export interface JsxNodeConstructorParams extends CreateJsxNodeOptions {
  key?: NodeKey
}

const EmptySerializedTextEditorState = {
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
      children: []
    } as SerializedParagraphNode
  ]
} as SerializedRootNode

const EmptySerializedFlowEditorState = {
  type: 'root',
  format: 'left',
  indent: 0,
  direction: 'ltr',
  version: 1,
  children: []
} as SerializedRootNode

/**
 * A lexical node that represents a JSX element. Use {@link "$createJsxNode"} to construct one.
 */
export class JsxNode extends DecoratorNode<JSX.Element> {
  __kind: JsxKind
  __name: string
  __attributes: MdxJsxAttribute[]
  __editor: LexicalEditor

  static getType(): string {
    return 'jsx'
  }

  static clone(node: JsxNode): JsxNode {
    return new JsxNode({
      name: node.__name,
      kind: node.__kind,
      attributes: node.__attributes,
      state: node.__editor.getEditorState().toJSON()
    })
  }

  static importJSON(serializedNode: SerializedJsxNode): JsxNode {
    const { name, kind, attributes, state } = serializedNode
    return $createJsxNode({
      kind,
      name,
      attributes,
      state
    })
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
      const parsedState = this.__editor.parseEditorState(
        { root: this.getKind() === 'text' ? EmptySerializedTextEditorState : EmptySerializedFlowEditorState },
        () => {
          if (this.getKind() === 'text') {
            const rootParagraph: ParagraphNode = $getRoot().getFirstChildOrThrow()
            updateFn(rootParagraph)
          } else {
            updateFn($getRoot())
          }
        }
      )
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
      version: 1
    }
  }

  inNestedEditor(callback: () => void) {
    this.__editor.getEditorState().read(callback)
  }

  getChildren(): LexicalNode[] {
    if (this.getKey() === 'flow') {
      return $getRoot().getChildren() || []
    } else {
      const firstChild = $getRoot().getFirstChild()
      if (!firstChild) {
        return []
      }
      return (firstChild as ParagraphNode).getChildren() || []
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

  updateAttributes(attributeValues: Record<string, string>) {
    this.getWritable().__attributes = Object.entries(attributeValues).map(([name, value]) => {
      return { name, value } as MdxJsxAttribute
    })
  }

  decorate(
    _parentEditor: LexicalEditor,
    {
      theme: {
        nodeDecoratorComponents: { JsxEditor }
      }
    }: ExtendedEditorConfig
  ): JSX.Element {
    return (
      <JsxEditor
        attributes={this.getAttributes()}
        componentName={this.getName()}
        kind={this.getKind()}
        editor={this.__editor}
        onSubmit={(attributeValues) => this.updateAttributes(attributeValues)}
        theme={contentTheme}
      />
    )
  }
}

/**
 * Creates a {@link JsxNode}.
 * @param options - The payload necessary for the creation of a {@link JsxNode}.
 *
 * @see {@link CreateJsxNodeOptions} for more details.
 */
export function $createJsxNode(options: CreateJsxNodeOptions): JsxNode {
  return new JsxNode(options)
}

/**
 * Returns true if a node is a {@link JsxNode}.
 */
export function $isJsxNode(node: LexicalNode | null | undefined): node is JsxNode {
  return node instanceof JsxNode
}
