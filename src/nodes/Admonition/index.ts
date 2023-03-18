import { addClassNamesToElement } from '@lexical/utils'
import {
  $applyNodeReplacement,
  $createParagraphNode,
  EditorConfig,
  ElementNode,
  LexicalNode,
  NodeKey,
  RangeSelection,
  SerializedElementNode,
  Spread,
} from 'lexical'

export type AdmonitionKind = 'note' | 'tip' | 'danger' | 'info' | 'caution'

export type SerializedAdmonitionNode = Spread<
  {
    type: 'admonition'
    kind: AdmonitionKind
    version: 1
  },
  SerializedElementNode
>

/** @noInheritDoc */
export class AdmonitionNode extends ElementNode {
  __kind: AdmonitionKind
  static getType(): string {
    return 'admonition'
  }

  getKind(): AdmonitionKind {
    return this.getLatest().__kind
  }

  setKind(kind: AdmonitionKind): void {
    if (kind !== this.getKind()) {
      this.getWritable().__kind = kind
    }
  }

  static clone(node: AdmonitionNode): AdmonitionNode {
    return new AdmonitionNode(node.__kind, node.__key)
  }

  constructor(kind?: AdmonitionKind, key?: NodeKey) {
    super(key)
    this.__kind = kind || 'note'
  }

  // View

  createDOM(config: EditorConfig): HTMLElement {
    const element = document.createElement('div')
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    addClassNamesToElement(element, config.theme.admonition[this.__kind] as string)

    return element
  }

  updateDOM(_prevNode: AdmonitionNode, _dom: HTMLElement): boolean {
    return false
  }

  // TODO:
  // static importDOM(): DOMConversionMap | null {
  //   return {
  //     blockquote: (node: Node) => ({
  //       conversion: convertBlockquoteElement,
  //       priority: 0,
  //     }),
  //   }
  // }

  static importJSON(serializedNode: SerializedAdmonitionNode): AdmonitionNode {
    const node = $createAdmonitionNode(serializedNode.kind)
    return node
  }

  exportJSON(): SerializedElementNode {
    return {
      ...super.exportJSON(),
      type: 'admonition',
    }
  }

  // Mutation
  insertNewAfter(_: RangeSelection, restoreSelection?: boolean): AdmonitionNode {
    const newBlock = $createAdmonitionNode()
    this.insertAfter(newBlock, restoreSelection)
    return newBlock
  }

  collapseAtStart(): true {
    const paragraph = $createParagraphNode()
    const children = this.getChildren()
    children.forEach((child) => paragraph.append(child))
    this.replace(paragraph)
    return true
  }
}

export function $createAdmonitionNode(kind?: AdmonitionKind): AdmonitionNode {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return $applyNodeReplacement(new AdmonitionNode(kind))
}

export function $isAdmonitionNode(node: LexicalNode | null | undefined): node is AdmonitionNode {
  return node instanceof AdmonitionNode
}
