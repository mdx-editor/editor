import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import React, { useEffect } from 'react'
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
  onChange: (code: string) => void
  onLanguageChange: (language: string) => void
}

export const CODE_BLOCK_ACTIVE_COMMAND = createCommand<{ language: string } | null>('CODE_BLOCK_ACTIVE')
export const SET_CODE_BLOCK_LANGUAGE_COMMAND = createCommand<string>('SET_CODE_BLOCK_LANGUAGE')

const CodeEditor = ({ code, language, onChange, onLanguageChange }: CodeEditorProps) => {
  const [editor] = useLexicalComposerContext()
  const codeMirrorRef = React.useRef<CodeMirrorRef>(null)
  console.log({ language })

  const onFocusHandler = React.useCallback(() => {
    editor.dispatchCommand(CODE_BLOCK_ACTIVE_COMMAND, { language })
  }, [editor, language])

  useEffect(() => {
    const cmContentDom = codeMirrorRef.current?.getCodemirror()?.contentDOM
    cmContentDom?.addEventListener('focus', onFocusHandler)
    return () => {
      cmContentDom?.removeEventListener('focus', onFocusHandler)
    }
  }, [codeMirrorRef, onFocusHandler, language])

  const wrappedOnChange = React.useCallback(
    (code: string) => {
      editor.update(() => {
        onChange(code)
      })
    },
    [editor, onChange]
  )

  useEffect(() => {
    console.log('effect ran')
    return mergeRegister(
      editor.registerCommand(
        SET_CODE_BLOCK_LANGUAGE_COMMAND,
        (newLanguage) => {
          editor.update(() => {
            onLanguageChange(newLanguage)
          })
          editor.dispatchCommand(CODE_BLOCK_ACTIVE_COMMAND, { language: newLanguage })
          return true
        },
        COMMAND_PRIORITY_CRITICAL
      )
    )
  }, [editor, onLanguageChange])

  // the sandpack provider does nothing, but it's required for the sandpack components to work.
  // force-remount the editor with the key prop when the language changes, so that the editor is reloaded
  return (
    <div>
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
