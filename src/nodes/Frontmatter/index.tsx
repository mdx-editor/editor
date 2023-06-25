import { DecoratorNode, EditorConfig, LexicalNode, NodeKey, SerializedLexicalNode, Spread } from 'lexical'
import React from 'react'
import { useEmitterValues } from '../../system/EditorSystemComponent'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'

export interface FrontmatterPayload {
  yaml: string
}

export type SerializedFrontmatterNode = Spread<
  {
    yaml: string
    version: 1
  },
  SerializedLexicalNode
>

interface FrontmatterEditorProps {
  yaml: string
  onChange: (yaml: string) => void
}

const InternalFrontmatterEditor = ({ yaml, onChange }: FrontmatterEditorProps) => {
  const [{ FrontmatterEditor }] = useEmitterValues('nodeDecorators')

  const [editor] = useLexicalComposerContext()

  const writeToEditor = React.useCallback(
    (yaml: string) => {
      editor?.update(() => {
        onChange(yaml)
      })
    },
    [editor, onChange]
  )

  return <FrontmatterEditor yaml={yaml} onChange={writeToEditor} />
}

export class FrontmatterNode extends DecoratorNode<JSX.Element> {
  __yaml: string

  static getType(): string {
    return 'frontmatter'
  }

  static clone(node: FrontmatterNode): FrontmatterNode {
    return new FrontmatterNode(node.__yaml, node.__key)
  }

  static importJSON(serializedNode: SerializedFrontmatterNode): FrontmatterNode {
    const { yaml } = serializedNode
    const node = $createFrontmatterNode({
      yaml,
    })
    return node
  }

  constructor(code: string, key?: NodeKey) {
    super(key)
    this.__yaml = code
  }

  exportJSON(): SerializedFrontmatterNode {
    return {
      yaml: this.getYaml(),
      type: 'frontmatter',
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

  getYaml(): string {
    return this.getLatest().__yaml
  }

  setYaml(yaml: string) {
    if (yaml !== this.__yaml) {
      this.getWritable().__yaml = yaml
    }
  }

  decorate(): JSX.Element {
    return <InternalFrontmatterEditor yaml={this.getYaml()} onChange={(yaml) => this.setYaml(yaml)} />
  }
}

export function $createFrontmatterNode({ yaml }: FrontmatterPayload): FrontmatterNode {
  return new FrontmatterNode(yaml)
}

export function $isFrontmatterNode(node: LexicalNode | null | undefined): node is FrontmatterNode {
  return node instanceof FrontmatterNode
}
