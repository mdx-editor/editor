import { useCellValue } from '@mdxeditor/gurx'
import { DecoratorNode, EditorConfig, LexicalEditor, LexicalNode, NodeKey, SerializedLexicalNode, Spread } from 'lexical'
import React from 'react'
import { voidEmitter } from '../../utils/voidEmitter'
import { CodeBlockEditorProps, defaultCodeBlockLanguage$ } from './utils'
import { NESTED_EDITOR_UPDATED_COMMAND, codeBlockEditorDescriptors$ } from '../core'

/**
 * The options necessary to construct a new code block node.
 * @group Code Block
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
 * @group Code Block
 */
export type SerializedCodeBlockNode = Spread<CreateCodeBlockNodeOptions & { type: 'codeblock'; version: 1 }, SerializedLexicalNode>

/**
 * A lexical node that represents a fenced code block. Use {@link "$createCodeBlockNode"} to construct one.
 * @group Code Block
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
    return this.__code
  }

  getMeta(): string {
    return this.__meta
  }

  getLanguage(): string {
    return this.__language
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

  isInline(): boolean {
    return false
  }
}

/**
 * A set of functions that modify the underlying code block node.
 * Access this with the {@link useCodeBlockEditorContext} hook in your custom code editor components.
 * @group Code Block
 */
export interface CodeBlockEditorContextValue {
  /**
   * Updates the code contents of the code block.
   */
  setCode: (code: string) => void
  /**
   * Updates the language of the code block. See {@link https://www.markdownguide.org/extended-syntax/#syntax-highlighting} for language examples.
   *
   */
  setLanguage: (language: string) => void
  /**
   * Updates the meta of the code block. The meta is the additional string that comes after the code block language.
   */
  setMeta: (meta: string) => void
  /**
   * The Lexical node that's being edited.
   */
  lexicalNode: CodeBlockNode
  /**
   * The parent Lexical editor.
   */
  parentEditor: LexicalEditor
}

const CodeBlockEditorContext = React.createContext<CodeBlockEditorContextValue | null>(null)

const CodeBlockEditorContextProvider: React.FC<{
  parentEditor: LexicalEditor
  lexicalNode: CodeBlockNode
  children: React.ReactNode
}> = ({ parentEditor, lexicalNode, children }) => {
  const contextValue = React.useMemo(() => {
    return {
      lexicalNode,
      parentEditor,
      setCode: (code: string) => {
        parentEditor.update(() => {
          lexicalNode.setCode(code)
          setTimeout(() => {
            parentEditor.dispatchCommand(NESTED_EDITOR_UPDATED_COMMAND, undefined)
          }, 0)
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
    }
  }, [lexicalNode, parentEditor])

  return <CodeBlockEditorContext.Provider value={contextValue}>{children}</CodeBlockEditorContext.Provider>
}

/**
 * Use this hook in your custom code block editors to modify the underlying node code, language, and meta.
 * @group Code Block
 */
export function useCodeBlockEditorContext() {
  const context = React.useContext(CodeBlockEditorContext)
  if (!context) {
    throw new Error('useCodeBlockEditor must be used within a CodeBlockEditor')
  }
  return context
}

const CodeBlockEditorContainer: React.FC<
  {
    /** The Lexical editor that contains the node */
    parentEditor: LexicalEditor
    /** The Lexical node that is being edited */
    codeBlockNode: CodeBlockNode
  } & CodeBlockEditorProps
> = (props) => {
  const codeBlockEditorDescriptors = useCellValue(codeBlockEditorDescriptors$)
  const defaultCodeBlockLanguage = useCellValue(defaultCodeBlockLanguage$)

  let descriptor = codeBlockEditorDescriptors
    .sort((a, b) => b.priority - a.priority)
    .find((descriptor) => descriptor.match(props.language || '', props.meta || ''))

  if (!descriptor) {
    descriptor = codeBlockEditorDescriptors.find((descriptor) => descriptor.match(defaultCodeBlockLanguage || '', props.meta || ''))
  }

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
 * @group Code Block
 */
export function $createCodeBlockNode(options: Partial<CreateCodeBlockNodeOptions>): CodeBlockNode {
  const { code = '', language = '', meta = '' } = options
  return new CodeBlockNode(code, language, meta)
}

/**
 * Returns true if the given node is a {@link CodeBlockNode}.
 * @group Code Block
 */
export function $isCodeBlockNode(node: LexicalNode | null | undefined): node is CodeBlockNode {
  return node instanceof CodeBlockNode
}
