/* eslint-disable @typescript-eslint/no-unsafe-argument */
import type { EditorConfig, LexicalEditor, LexicalNode, NodeKey, SerializedLexicalNode, Spread } from 'lexical'
import { DecoratorNode } from 'lexical'
import React, { JSX } from 'react'
import { NestedEditorsContext } from '../core/NestedLexicalEditor'
import { MdastJsx } from '.'
import { VoidEmitter, voidEmitter } from '../../utils/voidEmitter'
import { useCellValue } from '@mdxeditor/gurx'
import { jsxComponentDescriptors$ } from '../core'
import { ImportStatement } from '../../importMarkdownToLexical'

/**
 * A serialized representation of an {@link LexicalJsxNode}.
 */
export type SerializedLexicalJsxNode = Spread<
  {
    mdastNode: MdastJsx
    importStatement: ImportStatement | undefined
    type: 'jsx'
    version: 1
  },
  SerializedLexicalNode
>

/**
 * A lexical node that represents an image. Use {@link "$createLexicalJsxNode"} to construct one.
 */
export class LexicalJsxNode extends DecoratorNode<JSX.Element> {
  __mdastNode: MdastJsx
  __focusEmitter = voidEmitter()
  __importStatement?: ImportStatement

  static getType(): string {
    return 'jsx'
  }

  static clone(node: LexicalJsxNode): LexicalJsxNode {
    return new LexicalJsxNode(structuredClone(node.__mdastNode), structuredClone(node.__importStatement), node.__key)
  }

  static importJSON(serializedNode: SerializedLexicalJsxNode): LexicalJsxNode {
    return $createLexicalJsxNode(serializedNode.mdastNode, serializedNode.importStatement)
  }

  constructor(mdastNode: MdastJsx, importStatement?: ImportStatement, key?: NodeKey) {
    super(key)
    this.__mdastNode = mdastNode
    this.__importStatement = importStatement
  }

  getMdastNode(): MdastJsx {
    return this.__mdastNode
  }

  getImportStatement(): ImportStatement | undefined {
    return this.__importStatement
  }

  exportJSON(): SerializedLexicalJsxNode {
    return {
      mdastNode: this.getMdastNode(),
      importStatement: this.getImportStatement(),
      type: 'jsx',
      version: 1
    }
  }

  createDOM(): HTMLElement {
    return document.createElement(this.__mdastNode.type === 'mdxJsxTextElement' ? 'span' : 'div')
  }

  updateDOM(): false {
    return false
  }

  setMdastNode(mdastNode: MdastJsx): void {
    this.getWritable().__mdastNode = mdastNode
  }

  select = () => {
    this.__focusEmitter.publish()
  }

  decorate(parentEditor: LexicalEditor, config: EditorConfig): JSX.Element {
    return (
      <JsxEditorContainer
        lexicalJsxNode={this}
        config={config}
        mdastNode={this.getMdastNode()}
        parentEditor={parentEditor}
        focusEmitter={this.__focusEmitter}
      />
    )
  }

  isInline(): boolean {
    return this.__mdastNode.type === 'mdxJsxTextElement'
  }

  isKeyboardSelectable(): boolean {
    return true
  }
}

export function JsxEditorContainer(props: {
  /** The Lexical editor that contains the node */
  parentEditor: LexicalEditor
  /** The Lexical node that is being edited */
  lexicalJsxNode: LexicalJsxNode
  /** The MDAST node that is being edited */
  mdastNode: MdastJsx
  config: EditorConfig
  focusEmitter: VoidEmitter
}) {
  const { mdastNode } = props
  const jsxComponentDescriptors = useCellValue(jsxComponentDescriptors$)
  const descriptor =
    jsxComponentDescriptors.find((descriptor) => descriptor.name === mdastNode.name) ??
    jsxComponentDescriptors.find((descriptor) => descriptor.name === '*')

  if (!descriptor) {
    throw new Error(`No JSX descriptor found for ${mdastNode.name}`)
  }
  const Editor = descriptor.Editor

  return (
    <NestedEditorsContext.Provider
      value={{
        config: props.config,
        focusEmitter: props.focusEmitter,
        mdastNode: mdastNode,
        parentEditor: props.parentEditor,
        lexicalNode: props.lexicalJsxNode
      }}
    >
      <Editor descriptor={descriptor} mdastNode={mdastNode} />
    </NestedEditorsContext.Provider>
  )
}

/**
 * Creates an {@link LexicalJsxNode}.
 */
export function $createLexicalJsxNode(mdastNode: MdastJsx, importStatement?: ImportStatement): LexicalJsxNode {
  return new LexicalJsxNode(mdastNode, importStatement)
}

/**
 * Returns true if the node is an {@link LexicalJsxNode}.
 */
export function $isLexicalJsxNode(node: LexicalNode | null | undefined): node is LexicalJsxNode {
  return node instanceof LexicalJsxNode
}
