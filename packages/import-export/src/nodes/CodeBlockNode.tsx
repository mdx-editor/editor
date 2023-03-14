import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import React from 'react'
import { CodeEditor as TheEditorFromSandpack, SandpackProvider } from '@codesandbox/sandpack-react'
import {
  COMMAND_PRIORITY_CRITICAL,
  DecoratorNode,
  EditorConfig,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
  Spread,
  createCommand,
} from 'lexical'
import { CodeMirrorRef } from '@codesandbox/sandpack-react/dist/types/components/CodeEditor/CodeMirror'
import { mergeRegister } from '@lexical/utils'

export interface CodeBlockPayload {
  code: string
  language: string
}

export type SerializedCodeBlockNode = Spread<
  {
    code: string
    language: string
    type: 'codeblock'
    version: 1
  },
  SerializedLexicalNode
>

interface CodeEditorProps {
  code: string
  language: string
  nodeKey: string
  onChange: (code: string) => void
  onLanguageChange: (language: string) => void
}

export interface CodeBlockLanguagePayload {
  language: string
  nodeKey: string
}
export const CODE_BLOCK_ACTIVE_COMMAND = createCommand<CodeBlockLanguagePayload | null>('CODE_BLOCK_ACTIVE')
export const SET_CODE_BLOCK_LANGUAGE_COMMAND = createCommand<CodeBlockLanguagePayload>('SET_CODE_BLOCK_LANGUAGE')
export const FOCUS_CODE_BLOCK_COMMAND = createCommand<{ nodeKey: string }>('FOCUS_CODE_BLOCK')

const CodeEditor = ({ nodeKey, code, language, onChange, onLanguageChange }: CodeEditorProps) => {
  const [editor] = useLexicalComposerContext()
  const codeMirrorRef = React.useRef<CodeMirrorRef>(null)

  const onFocusHandler = React.useCallback(() => {
    editor.dispatchCommand(CODE_BLOCK_ACTIVE_COMMAND, { language, nodeKey })
  }, [editor, language])

  React.useEffect(() => {
    const cmContentDom = codeMirrorRef.current?.getCodemirror()?.contentDOM
    cmContentDom?.addEventListener('focus', onFocusHandler)
    return () => {
      cmContentDom?.removeEventListener('focus', onFocusHandler)
    }
  }, [codeMirrorRef, onFocusHandler, language])

  // if newly inserted, focus the editor
  React.useEffect(() => {
    if (code === '') {
      codeMirrorRef.current?.getCodemirror()?.focus()
    }
  }, [codeMirrorRef])

  const wrappedOnChange = React.useCallback(
    (code: string) => {
      editor.update(() => {
        onChange(code)
      })
    },
    [editor, onChange]
  )

  React.useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        SET_CODE_BLOCK_LANGUAGE_COMMAND,
        ({ language: newLanguage, nodeKey: theKeyOfTheChangedNode }) => {
          if (nodeKey === theKeyOfTheChangedNode) {
            editor.update(() => {
              onLanguageChange(newLanguage)
            })
            editor.dispatchCommand(CODE_BLOCK_ACTIVE_COMMAND, { language: newLanguage, nodeKey })
            return true
          }
          return false
        },
        COMMAND_PRIORITY_CRITICAL
      ),
      editor.registerCommand(
        FOCUS_CODE_BLOCK_COMMAND,
        ({ nodeKey: theKeyOfTheChangedNode }) => {
          console.log('FOCUS_CODE_BLOCK_COMMAND', theKeyOfTheChangedNode, nodeKey)

          if (nodeKey === theKeyOfTheChangedNode) {
            // codeMirrorRef.current?.getCodemirror()?.focus()
            return true
          }
          return false
        },
        COMMAND_PRIORITY_CRITICAL
      )
    )
  }, [editor, onLanguageChange, nodeKey])

  // the sandpack provider does nothing, but it's required for the sandpack components to work.
  // force-remount the editor with the key prop when the language changes, so that the editor is reloaded
  return (
    <div onKeyDown={(e) => e.stopPropagation()}>
      <SandpackProvider>
        <TheEditorFromSandpack
          initMode="immediate"
          showLineNumbers
          key={language}
          filePath={`file.${language || 'txt'}`}
          code={code}
          onCodeUpdate={wrappedOnChange}
          ref={codeMirrorRef}
        />
      </SandpackProvider>
    </div>
  )
}

export class CodeBlockNode extends DecoratorNode<JSX.Element> {
  __code: string
  __language: string

  static getType(): string {
    return 'codeblock'
  }

  static clone(node: CodeBlockNode): CodeBlockNode {
    return new CodeBlockNode(node.__code, node.__language, node.__key)
  }

  static importJSON(serializedNode: SerializedCodeBlockNode): CodeBlockNode {
    const { code, language } = serializedNode
    const node = $createCodeBlockNode({
      code,
      language,
    })
    return node
  }

  constructor(code: string, language: string, key?: NodeKey) {
    super(key)
    this.__code = code
    this.__language = language
  }

  exportJSON(): SerializedCodeBlockNode {
    return {
      code: this.getCode(),
      language: this.getLanguage(),
      type: 'codeblock',
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

  getLanguage(): string {
    return this.getLatest().__language
  }

  setCode(code: string) {
    if (code !== this.__code) {
      this.getWritable().__code = code
    }
  }

  setLanguage(language: string) {
    if (language !== this.__language) {
      this.getWritable().__language = language
    }
  }

  decorate(): JSX.Element {
    return (
      <CodeEditor
        code={this.getCode()}
        nodeKey={this.getKey()}
        language={this.getLanguage()}
        onChange={(code) => this.setCode(code)}
        onLanguageChange={(language) => this.setLanguage(language)}
      />
    )
  }
}

export function $createCodeBlockNode({ code, language }: CodeBlockPayload): CodeBlockNode {
  return new CodeBlockNode(code, language)
}

export function $isCodeBlockNode(node: LexicalNode | null | undefined): node is CodeBlockNode {
  return node instanceof CodeBlockNode
}
