import type { DOMConversionMap, EditorConfig, LexicalNode, SerializedElementNode } from 'lexical'

import { ElementNode } from 'lexical'

export type SerializedLayoutItemNode = SerializedElementNode

export class MarkdownImporterNode extends ElementNode {
  static getType(): string {
    return 'markdown-importer'
  }

  static clone(node: MarkdownImporterNode): MarkdownImporterNode {
    return new MarkdownImporterNode(node.__key)
  }

  createDOM(config: EditorConfig): HTMLElement {
    const dom = document.createElement('div')
    return dom
  }

  updateDOM(): boolean {
    return false
  }

  static importDOM(): DOMConversionMap | null {
    return {}
  }

  static importJSON(): MarkdownImporterNode {
    return $createMarkdownImporterNode()
  }

  isShadowRoot(): boolean {
    return true
  }

  exportJSON(): SerializedLayoutItemNode {
    return {
      ...super.exportJSON(),
      type: 'markdown-importer',
      version: 1
    }
  }
}

export function $createMarkdownImporterNode(): MarkdownImporterNode {
  return new MarkdownImporterNode()
}

export function $isMarkdownImporterNode(node: LexicalNode | null | undefined): node is MarkdownImporterNode {
  return node instanceof MarkdownImporterNode
}
