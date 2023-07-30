import React from 'react'
import { DecoratorNode, EditorConfig, LexicalEditor, LexicalNode, NodeKey, SerializedLexicalNode, Spread } from 'lexical'
import { noop } from '../../utils/fp'
import { CodeBlockEditorProps, codeBlockPluginHooks } from './realmPlugin'
/**
 * The options necessary to construct a {@link CodeBlockNode}.
 */
export interface CreateCodeBlockNodeOptions {
  /**
   * The code contents of the block.
   */
  code: string
  /**
   * The language of the code block (i.e. `js`, `jsx`, etc.). This is used for syntax highlighting.
   */
  language: string
  /**
   * The additional meta data of the block.
   */
  meta: string
}

/**
 * A serialized representation of an {@link CodeBlockNode}.
 */
export type SerializedCodeBlockNode = Spread<CreateCodeBlockNodeOptions & { type: 'codeblock'; version: 1 }, SerializedLexicalNode>

function voidEmitter() {
  let subscription = noop
  return {
    publish: () => {
      subscription()
    },
    subscribe: (cb: () => void) => {
      subscription = cb
    }
  }
}

/**
 * A lexical node that represents a fenced code block. Use {@link "$createCodeBlockNode"} to construct one.
 */
export class CodeBlockNode extends DecoratorNode<JSX.Element> {
  __code: string
  __meta: string
  __language: string
  __focusEmitter = voidEmitter()

  static getType(): string {
    return 'codeblock'
  }

  static clone(node: CodeBlockNode): CodeBlockNode {
    return new CodeBlockNode(node.__code, node.__language, node.__meta, node.__key)
  }

  static importJSON(serializedNode: SerializedCodeBlockNode): CodeBlockNode {
    const { code, meta, language } = serializedNode
    return $createCodeBlockNode({
      code,
      language,
      meta
    })
  }

  constructor(code: string, language: string, meta: string, key?: NodeKey) {
    super(key)
    this.__code = code
    this.__meta = meta
    this.__language = language
  }

  exportJSON(): SerializedCodeBlockNode {
    return {
      code: this.getCode(),
      language: this.getLanguage(),
      meta: this.getMeta(),
      type: 'codeblock',
      version: 1
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

  getMeta(): string {
    return this.getLatest().__meta
  }

  getLanguage(): string {
    return this.getLatest().__language
  }

  setCode = (code: string) => {
    if (code !== this.__code) {
      this.getWritable().__code = code
    }
  }

  setMeta = (meta: string) => {
    if (meta !== this.__meta) {
      this.getWritable().__meta = meta
    }
  }

  setLanguage = (language: string) => {
    if (language !== this.__language) {
      this.getWritable().__language = language
    }
  }

  select = () => {
    this.__focusEmitter.publish()
  }

  decorate(editor: LexicalEditor): JSX.Element {
    return (
      <CodeBlockEditorContainer
        parentEditor={editor}
        code={this.getCode()}
        meta={this.getMeta()}
        language={this.getLanguage()}
        codeBlockNode={this}
        nodeKey={this.getKey()}
        focusEmitter={this.__focusEmitter}
      />
    )
  }
}

interface CodeBlockEditorContainerProps extends CodeBlockEditorProps {
  /** The Lexical editor that contains the node */
  parentEditor: LexicalEditor
  /** The Lexical node that is being edited */
  codeBlockNode: CodeBlockNode
}

type CodeBlockContextProviderProps = {
  parentEditor: LexicalEditor
  lexicalNode: CodeBlockNode
  children: React.ReactNode
}

const CodeBlockEditorContext = React.createContext<Pick<CodeBlockNode, 'setCode' | 'setLanguage' | 'setMeta'> | null>(null)

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

/**
 * Creates a {@link CodeBlockNode}.
 * @param options - The code contents, the language  (i.e. js, jsx, etc.), and the additional meta data of the block.
 */
export function $createCodeBlockNode(options: Partial<CreateCodeBlockNodeOptions>): CodeBlockNode {
  const { code = '', language = '', meta = '' } = options
  return new CodeBlockNode(code, language, meta)
}

/**
 * Returns true if the given node is a {@link CodeBlockNode}.
 */
export function $isCodeBlockNode(node: LexicalNode | null | undefined): node is CodeBlockNode {
  return node instanceof CodeBlockNode
}
