import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import React, { useEffect } from 'react'
import { CodeEditor as TheEditorFromSandpack, SandpackPreview, SandpackProvider } from '@codesandbox/sandpack-react'
import { DecoratorNode, EditorConfig, LexicalNode, NodeKey, SerializedLexicalNode, Spread, createCommand } from 'lexical'
import { CodeMirrorRef } from '@codesandbox/sandpack-react/dist/types/components/CodeEditor/CodeMirror'

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

export const CODE_BLOCK_FOCUS_COMMAND = createCommand<boolean>('CODE_BLOCK_FOCUS')

const CodeEditor = ({ code, language, onChange, onLanguageChange }: CodeEditorProps) => {
  const [editor] = useLexicalComposerContext()
  const codeMirrorRef = React.useRef<CodeMirrorRef>(null)
  const [isFocused, setIsFocused] = React.useState(false)

  const onFocusHandler = React.useCallback(() => {
    setIsFocused(true)
    editor.dispatchCommand(CODE_BLOCK_FOCUS_COMMAND, true)
  }, [editor])

  const onBlurHandler = React.useCallback(() => {
    setIsFocused(false)
    editor.dispatchCommand(CODE_BLOCK_FOCUS_COMMAND, false)
  }, [editor])

  useEffect(() => {
    const cmContentDom = codeMirrorRef.current?.getCodemirror()?.contentDOM
    cmContentDom?.addEventListener('focus', onFocusHandler)
    cmContentDom?.addEventListener('blur', onBlurHandler)
    return () => {
      cmContentDom?.removeEventListener('focus', onFocusHandler)
      cmContentDom?.removeEventListener('blur', onBlurHandler)
    }
  }, [codeMirrorRef, onFocusHandler, onBlurHandler])

  const wrappedOnChange = React.useCallback(
    (code: string) => {
      editor.update(() => {
        onChange(code)
      })
    },
    [onChange]
  )

  const wrappedOnLanguageChange = React.useCallback(
    (language: string) => {
      editor.update(() => {
        onLanguageChange(language)
      })
    },
    [onChange]
  )

  // the sandpack provider does nothing, but it's required for the sandpack components to work.
  // force-remount the sandpack provider when the language changes, so that the editor is reloaded
  return (
    <div key={language}>
      <select value={language} onChange={(e) => wrappedOnLanguageChange(e.target.value)}>
        <option value="js">JavaScript</option>
        <option value="jsx">JavaScript (React)</option>
        <option value="ts">TypeScript</option>
        <option value="tsx">TypeScript (React)</option>
        <option value="css">CSS</option>
      </select>

      <SandpackProvider>
        <TheEditorFromSandpack
          initMode="immediate"
          showLineNumbers
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
