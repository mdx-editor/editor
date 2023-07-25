/* eslint-disable @typescript-eslint/no-unsafe-argument */
import React from 'react'
import { LexicalEditor } from 'lexical'
import { NestedEditorsContext } from '../core/NestedLexicalEditor'
import { jsxPluginHooks } from './realmPlugin'
import { MdastJsx } from '../../types/JsxComponentDescriptors'

export interface JsxEditorContainerProps {
  /** The Lexical editor that contains the node */
  parentEditor: LexicalEditor
  /** The Lexical node that is being edited */
  lexicalJsxNode: {
    setMdastNode: (mdastNode: MdastJsx) => void
  }
  /** The MDAST node that is being edited */
  mdastNode: MdastJsx
}

export function JsxEditorContainer(props: JsxEditorContainerProps) {
  const { mdastNode } = props
  const [jsxComponentDescriptors] = jsxPluginHooks.useEmitterValues('jsxComponentDescriptors')
  const descriptor = jsxComponentDescriptors.find((descriptor) => descriptor.name === mdastNode.name)!
  const Editor = descriptor.Editor

  return (
    <NestedEditorsContext.Provider
      value={{
        mdastNode: mdastNode,
        parentEditor: props.parentEditor,
        lexicalNode: props.lexicalJsxNode
      }}
    >
      <Editor descriptor={descriptor} mdastNode={mdastNode} />
    </NestedEditorsContext.Provider>
  )
}
