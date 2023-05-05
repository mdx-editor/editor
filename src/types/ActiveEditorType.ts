type LexicalEditorType = {
  type: 'lexical'
}

type CodeBlockEditorType = {
  type: 'codeblock'
  nodeKey: string
}

type SandpackEditorType = {
  type: 'sandpack'
  nodeKey: string
}

export type ActiveEditorType = LexicalEditorType | CodeBlockEditorType | SandpackEditorType
