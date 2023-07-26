/* eslint-disable @typescript-eslint/no-unsafe-argument */
import React from 'react'
import { LexicalEditor } from 'lexical'
import { CodeBlockEditorProps, codeBlockPluginHooks } from './realmPlugin'

export interface CodeBlockOperations {
  setCode: (code: string) => void
  setLanguage: (language: string) => void
  setMeta: (meta: string) => void
}

export interface CodeBlockEditorContainerProps extends CodeBlockEditorProps {
  /** The Lexical editor that contains the node */
  parentEditor: LexicalEditor
  /** The Lexical node that is being edited */
  codeBlockNode: CodeBlockOperations
}

export type CodeBlockContextProviderProps = {
  parentEditor: LexicalEditor
  lexicalNode: CodeBlockOperations
  children: React.ReactNode
}

const CodeBlockEditorContext = React.createContext<CodeBlockOperations | null>(null)

const CodeBlockEditorContextProvider = ({ parentEditor, lexicalNode, children }: CodeBlockContextProviderProps) => {
  return (
    <CodeBlockEditorContext.Provider
      value={{
        setCode: (code: string) => {
          parentEditor.update(() => {
            lexicalNode.setCode(code)
          })
        },
        setLanguage: (language: string) => {
          parentEditor.update(() => {
            lexicalNode.setLanguage(language)
          })
        },
        setMeta: (meta: string) => {
          parentEditor.update(() => {
            lexicalNode.setMeta(meta)
          })
        }
      }}
    >
      {children}
    </CodeBlockEditorContext.Provider>
  )
}

export function useCodeBlockEditorContext() {
  const context = React.useContext(CodeBlockEditorContext)
  if (!context) {
    throw new Error('useCodeBlockEditor must be used within a CodeBlockEditor')
  }
  return context
}

export function CodeBlockEditorContainer(props: CodeBlockEditorContainerProps) {
  const [codeBlockEditorDescriptors] = codeBlockPluginHooks.useEmitterValues('codeBlockEditorDescriptors')

  const descriptor = codeBlockEditorDescriptors
    .sort((a, b) => b.priority - a.priority)
    .find((descriptor) => descriptor.match(props.language || '', props.meta || ''))

  if (!descriptor) {
    throw new Error(`No CodeBlockEditor registered for language=${props.language} meta=${props.meta}`)
  }

  const Editor = descriptor.Editor

  const { codeBlockNode: _, parentEditor: __, ...restProps } = props

  return (
    <CodeBlockEditorContextProvider parentEditor={props.parentEditor} lexicalNode={props.codeBlockNode}>
      <Editor {...restProps} />
    </CodeBlockEditorContextProvider>
  )
}
