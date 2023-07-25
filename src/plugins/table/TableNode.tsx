import { DecoratorNode, LexicalEditor, LexicalNode, NodeKey, SerializedLexicalNode, Spread } from 'lexical'
import * as Mdast from 'mdast'
import React from 'react'
import { noop } from '../../utils/fp'
import { TableEditor } from './TableEditor'

/**
 * A serialized representation of a {@link TableNode}.
 */
export type SerializedTableNode = Spread<
  {
    mdastNode: Mdast.Table
  },
  SerializedLexicalNode
>

const EMPTY_CELL: Mdast.TableCell = { type: 'tableCell', children: [] as Mdast.PhrasingContent[] }

type CoordinatesSubscription = (coords: [colIndex: number, rowIndex: number]) => void

function coordinatesEmitter() {
  let subscription: CoordinatesSubscription = noop
  return {
    publish: (coords: [colIndex: number, rowIndex: number]) => {
      subscription(coords)
    },
    subscribe: (cb: CoordinatesSubscription) => {
      subscription = cb
    }
  }
}

/**
 * A lexical node that represents a table, with features specific to the markdown tables.
 * Use {@link "$createTableNode"} to construct one.
 */
export class TableNode extends DecoratorNode<JSX.Element> {
  __mdastNode: Mdast.Table
  focusEmitter = coordinatesEmitter()

  static getType(): string {
    return 'table'
  }

  static clone(node: TableNode): TableNode {
    return new TableNode(structuredClone(node.__mdastNode), node.__key)
  }

  static importJSON(serializedNode: SerializedTableNode): TableNode {
    return $createTableNode(serializedNode.mdastNode)
  }

  exportJSON(): SerializedTableNode {
    return {
      mdastNode: structuredClone(this.__mdastNode),
      type: 'table',
      version: 1
    }
  }

  getMdastNode(): Mdast.Table {
    return this.__mdastNode
  }

  getRowCount(): number {
    return this.__mdastNode.children.length
  }

  getColCount(): number {
    return this.__mdastNode.children[0]?.children.length || 0
  }

  constructor(mdastNode?: Mdast.Table, key?: NodeKey) {
    super(key)
    this.__mdastNode = mdastNode || { type: 'table', children: [] }
  }

  createDOM(): HTMLElement {
    return document.createElement('div')
  }

  updateDOM(): false {
    return false
  }

  updateCellContents(colIndex: number, rowIndex: number, children: Mdast.PhrasingContent[]): void {
    const self = this.getWritable()
    const table = self.__mdastNode
    const row = table.children[rowIndex]
    const cells = row.children
    const cell = cells[colIndex]
    const cellsClone = Array.from(cells)
    const cellClone = { ...cell, children }
    const rowClone = { ...row, children: cellsClone }
    cellsClone[colIndex] = cellClone
    table.children[rowIndex] = rowClone
  }

  insertColumnAt(colIndex: number): void {
    const self = this.getWritable()
    const table = self.__mdastNode
    for (let rowIndex = 0; rowIndex < table.children.length; rowIndex++) {
      const row = table.children[rowIndex]
      const cells = row.children
      const cellsClone = Array.from(cells)
      const rowClone = { ...row, children: cellsClone }
      cellsClone.splice(colIndex, 0, structuredClone(EMPTY_CELL))
      table.children[rowIndex] = rowClone
    }

    if (table.align && table.align.length > 0) {
      table.align.splice(colIndex, 0, 'left')
    }
  }

  deleteColumnAt(colIndex: number): void {
    const self = this.getWritable()
    const table = self.__mdastNode
    for (let rowIndex = 0; rowIndex < table.children.length; rowIndex++) {
      const row = table.children[rowIndex]
      const cells = row.children
      const cellsClone = Array.from(cells)
      const rowClone = { ...row, children: cellsClone }
      cellsClone.splice(colIndex, 1)
      table.children[rowIndex] = rowClone
    }
  }

  insertRowAt(y: number): void {
    const self = this.getWritable()
    const table = self.__mdastNode
    const newRow: Mdast.TableRow = {
      type: 'tableRow',
      children: Array.from({ length: this.getColCount() }, () => structuredClone(EMPTY_CELL))
    }
    table.children.splice(y, 0, newRow)
  }

  deleteRowAt(rowIndex: number): void {
    this.getWritable().__mdastNode.children.splice(rowIndex, 1)
  }

  addRowToBottom(): void {
    this.insertRowAt(this.getRowCount())
  }

  addColumnToRight(): void {
    this.insertColumnAt(this.getColCount())
  }

  setColumnAlign(colIndex: number, align: Mdast.AlignType) {
    const self = this.getWritable()
    const table = self.__mdastNode
    if (table.align == null) {
      table.align = []
    }
    table.align[colIndex] = align
  }

  decorate(parentEditor: LexicalEditor): JSX.Element {
    return <TableEditor lexicalTable={this} mdastNode={this.__mdastNode} parentEditor={parentEditor} />
  }

  select(coords: [colIndex: number, rowIndex: number]): void {
    this.focusEmitter.publish(coords)
  }

  isInline(): false {
    return false
  }
}

/**
 * Retruns true if the given node is a {@link TableNode}.
 */
export function $isTableNode(node: LexicalNode | null | undefined): node is TableNode {
  return node instanceof TableNode
}

/**
 * Creates a {@link TableNode}
 * @param mdastNode - The mdast node to create the {@link TableNode} from.
 */
export function $createTableNode(mdastNode: Mdast.Table): TableNode {
  return new TableNode(mdastNode)
}
