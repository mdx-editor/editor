import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import React from 'react'
import { DecoratorNode, EditorConfig, LexicalNode, NodeKey, SerializedLexicalNode, Spread } from 'lexical'
import YamlParser from 'js-yaml'

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

type FrontmatterData = Array<[string, string]>

const FrontmatterEditor = ({ yaml, onChange }: FrontmatterEditorProps) => {
  const [entries, setEntries] = React.useState<FrontmatterData>(() => {
    return Object.entries(YamlParser.load(yaml) as Record<string, string>)
  })

  const [editor] = useLexicalComposerContext()

  React.useEffect(() => {
    editor.update(() => {
      const yaml = entries.reduce((acc, [key, value]) => {
        acc[key] = value
        return acc
      }, {} as Record<string, string>)
      onChange(YamlParser.dump(yaml).trim())
    })
  }, [entries])

  return (
    <div>
      {entries.map(([key, value], index) => {
        return (
          <div style={{ display: 'flex' }} key={index}>
            <div>
              <input
                value={key}
                {...(key === '' ? { autoFocus: true } : {})}
                onChange={(e) => {
                  setEntries((current) => {
                    return [...current.slice(0, index), [e.target.value, value], ...current.slice(index + 1)] as FrontmatterData
                  })
                }}
              />
            </div>
            <div>
              <input
                value={value}
                onChange={(e) => {
                  setEntries((current) => {
                    return [...current.slice(0, index), [key, e.target.value], ...current.slice(index + 1)] as FrontmatterData
                  })
                }}
              />
            </div>
            <div>
              <button onClick={() => setEntries((current) => [...current.slice(0, index), ...current.slice(index + 1)] as FrontmatterData)}>
                Delete
              </button>
            </div>
          </div>
        )
      })}
      <div>
        <button onClick={() => setEntries((entries) => [...entries, ['', '']])}>Add</button>
      </div>
    </div>
  )
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
    return <FrontmatterEditor yaml={this.getYaml()} onChange={(yaml) => this.setYaml(yaml)} />
  }
}

export function $createFrontmatterNode({ yaml }: FrontmatterPayload): FrontmatterNode {
  return new FrontmatterNode(yaml)
}

export function $isFrontmatterNode(node: LexicalNode | null | undefined): node is FrontmatterNode {
  return node instanceof FrontmatterNode
}
