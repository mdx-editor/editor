export type LexicalEditorType = {
  type: 'lexical'
}

export type CodeBlockEditorType = {
  type: 'codeblock'
  nodeKey: string
}

export type SandpackEditorType = {
  type: 'sandpack'
  nodeKey: string
}

export type ActiveEditorType = LexicalEditorType | CodeBlockEditorType | SandpackEditorType
