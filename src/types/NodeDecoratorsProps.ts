import React from 'react'
import { EditorThemeClasses, LexicalEditor } from 'lexical'
import { MdxJsxAttribute } from 'mdast-util-mdx-jsx'
import { TableNode } from '../nodes'
import * as Mdast from 'mdast'
import { LeafDirectiveNode } from '../nodes/LeafDirectiveNode'
import { LeafDirective } from 'mdast-util-directive'

export interface FrontmatterEditorProps {
  yaml: string
  onChange: (yaml: string) => void
}

export type JsxKind = 'text' | 'flow'

export interface JsxEditorProps {
  kind: JsxKind
  attributes: MdxJsxAttribute[]
  componentName: string
  onSubmit: (values: Record<string, string>) => void
  theme: EditorThemeClasses
  editor: LexicalEditor
}

export interface VoidEmitter {
  publish: () => void
  subscribe: (callback: () => void) => void
}

export interface SandpackEditorProps {
  code: string
  nodeKey: string
  meta: string
  onChange: (code: string) => void
  focusEmitter: VoidEmitter
}

export interface CodeBlockEditorProps extends SandpackEditorProps {
  language: string
}

export interface TableEditorProps {
  parentEditor: LexicalEditor
  lexicalTable: TableNode
  mdastNode: Mdast.Table
}

export interface ImageEditorProps {
  nodeKey: string
  src: string
  title?: string
}

export interface LeafDirectiveEditorProps<T extends LeafDirective> {
  /** The Lexical editor that contains the node */
  parentEditor: LexicalEditor
  /** The Lexical node that is being edited */
  leafDirective: LeafDirectiveNode
  /** The MDAST node that is being edited */
  mdastNode: T
}

export interface CustomLeafDirectiveEditor<T extends LeafDirective> {
  testNode: (mdastNode: LeafDirective) => boolean
  Editor: React.ComponentType<LeafDirectiveEditorProps<T>>
}
