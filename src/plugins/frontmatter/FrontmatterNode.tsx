import { DecoratorNode, EditorConfig, LexicalEditor, LexicalNode, NodeKey, SerializedLexicalNode, Spread } from 'lexical'
import React, { JSX } from 'react'
import { FrontmatterEditor } from './FrontmatterEditor'

/**
 * A serialized representation of an {@link FrontmatterNode}.
 */
export type SerializedFrontmatterNode = Spread<
  {
    yaml: string
    version: 1
  },
  SerializedLexicalNode
>

/**
 * Represents {@link https://daily-dev-tips.com/posts/what-exactly-is-frontmatter/ | the frontmatter} of the markdown document.
 * Use {@link "$createFrontmatterNode"} to construct one.
 */
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
    const node = $createFrontmatterNode(yaml)
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

  getYaml(): string {
    return this.getLatest().__yaml
  }

  setYaml(yaml: string) {
    if (yaml !== this.__yaml) {
      this.getWritable().__yaml = yaml
    }
  }

  decorate(editor: LexicalEditor): JSX.Element {
    return (
      <FrontmatterEditor
        yaml={this.getYaml()}
        onChange={(yaml) => {
          editor.update(() => {
            this.setYaml(yaml)
          })
        }}
      />
    )
  }

  isKeyboardSelectable(): boolean {
    return false
  }
}

/**
 * Creates a {@link FrontmatterNode}.
 * @param yaml - The YAML string of the frontmatter.
 */
export function $createFrontmatterNode(yaml: string): FrontmatterNode {
  return new FrontmatterNode(yaml)
}

/**
 * Returns `true` if the given node is a {@link FrontmatterNode}.
 */
export function $isFrontmatterNode(node: LexicalNode | null | undefined): node is FrontmatterNode {
  return node instanceof FrontmatterNode
}
