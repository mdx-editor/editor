/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  $getRoot,
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  EditorConfig,
  LexicalEditor,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
  Spread,
  createEditor,
} from 'lexical'

import { DecoratorNode } from 'lexical'
import React from 'react'
import * as Mdast from 'mdast'
import { uuidv4 } from '../../utils/uuid4'
import { MarkdownAstRenderer } from '../../ui/MarkdownAstRenderer'
import { LexicalNestedComposer } from '@lexical/react/LexicalNestedComposer'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary'
import { theme } from '../../content/theme'
import { UsedLexicalNodes, importMdastTreeToLexical } from '../../import'
import { LexicalVisitors, exportLexicalTreeToMdast } from '../../export'

export type Cell = {
  colSpan: number
  json: string
  type: 'normal' | 'header'
  id: string
  width: number | null
}

export type Row = {
  cells: Array<Cell>
  height: null | number
  id: string
}

export type Rows = Array<Row>

export const cellHTMLCache: Map<string, string> = new Map()
export const cellTextContentCache: Map<string, string> = new Map()

const emptyEditorJSON =
  '{"root":{"children":[{"children":[],"direction":null,"format":"","indent":0,"type":"paragraph","version":1}],"direction":null,"format":"","indent":0,"type":"root","version":1}}'

const plainTextEditorJSON = (text: string) =>
  text === ''
    ? emptyEditorJSON
    : `{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":${text},"type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}`

function createCell(type: 'normal' | 'header'): Cell {
  return {
    colSpan: 1,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    id: uuidv4(),
    json: emptyEditorJSON,
    type,
    width: null,
  }
}

export function createRow(): Row {
  return {
    cells: [],
    height: null,
    id: uuidv4(),
  }
}

export type SerializedTableNode = Spread<
  {
    mdastNode: Mdast.Table
  },
  SerializedLexicalNode
>

export function extractRowsFromHTML(tableElem: HTMLTableElement): Rows {
  const rowElems = tableElem.querySelectorAll('tr')
  const rows: Rows = []
  for (let y = 0; y < rowElems.length; y++) {
    const rowElem = rowElems[y]
    const cellElems = rowElem.querySelectorAll('td,th')
    if (!cellElems || cellElems.length === 0) {
      continue
    }
    const cells: Array<Cell> = []
    for (let x = 0; x < cellElems.length; x++) {
      const cellElem = cellElems[x] as HTMLElement
      const isHeader = cellElem.nodeName === 'TH'
      const cell = createCell(isHeader ? 'header' : 'normal')
      cell.json = plainTextEditorJSON(JSON.stringify(cellElem.innerText.replace(/\n/g, ' ')))
      cells.push(cell)
    }
    const row = createRow()
    row.cells = cells
    rows.push(row)
  }
  return rows
}

function convertTableElement(domNode: HTMLElement): null | DOMConversionOutput {
  const rowElems = domNode.querySelectorAll('tr')
  if (!rowElems || rowElems.length === 0) {
    return null
  }
  const rows: Rows = []
  for (let y = 0; y < rowElems.length; y++) {
    const rowElem = rowElems[y]
    const cellElems = rowElem.querySelectorAll('td,th')
    if (!cellElems || cellElems.length === 0) {
      continue
    }
    const cells: Array<Cell> = []
    for (let x = 0; x < cellElems.length; x++) {
      const cellElem = cellElems[x] as HTMLElement
      const isHeader = cellElem.nodeName === 'TH'
      const cell = createCell(isHeader ? 'header' : 'normal')
      cell.json = plainTextEditorJSON(JSON.stringify(cellElem.innerText.replace(/\n/g, ' ')))
      cells.push(cell)
    }
    const row = createRow()
    row.cells = cells
    rows.push(row)
  }
  return { node: $createTableNode(rows) }
}

export function exportTableCellsToHTML(rows: Rows, rect?: { startX: number; endX: number; startY: number; endY: number }): HTMLElement {
  const table = document.createElement('table')
  const colGroup = document.createElement('colgroup')
  const tBody = document.createElement('tbody')
  const firstRow = rows[0]

  for (let x = rect != null ? rect.startX : 0; x < (rect != null ? rect.endX + 1 : firstRow.cells.length); x++) {
    const col = document.createElement('col')
    colGroup.append(col)
  }

  for (let y = rect != null ? rect.startY : 0; y < (rect != null ? rect.endY + 1 : rows.length); y++) {
    const row = rows[y]
    const cells = row.cells
    const rowElem = document.createElement('tr')

    for (let x = rect != null ? rect.startX : 0; x < (rect != null ? rect.endX + 1 : cells.length); x++) {
      const cell = cells[x]
      const cellElem = document.createElement(cell.type === 'header' ? 'th' : 'td')
      cellElem.innerHTML = cellHTMLCache.get(cell.json) || ''
      rowElem.appendChild(cellElem)
    }
    tBody.appendChild(rowElem)
  }

  table.appendChild(colGroup)
  table.appendChild(tBody)
  return table
}

export class TableNode extends DecoratorNode<JSX.Element> {
  __rows: Rows = []
  __mdastNode: Mdast.Table

  static getType(): string {
    return 'table'
  }

  static clone(node: TableNode): TableNode {
    return new TableNode(Object.assign({}, node.__mdastNode), node.__key)
  }

  static importJSON(serializedNode: SerializedTableNode): TableNode {
    return $createTableNode(serializedNode.mdastNode)
  }

  exportJSON(): SerializedTableNode {
    return {
      mdastNode: this.__mdastNode,
      type: 'table',
      version: 1,
    }
  }

  static importDOM(): DOMConversionMap | null {
    return {
      table: (_node: Node) => ({
        conversion: convertTableElement,
        priority: 0,
      }),
    }
  }

  exportDOM(): DOMExportOutput {
    return { element: exportTableCellsToHTML(this.__rows) }
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

  updateCellJSON(x: number, y: number, json: string): void {
    const self = this.getWritable()
    const rows = self.__rows
    const row = rows[y]
    const cells = row.cells
    const cell = cells[x]
    const cellsClone = Array.from(cells)
    const cellClone = { ...cell, json }
    const rowClone = { ...row, cells: cellsClone }
    cellsClone[x] = cellClone
    rows[y] = rowClone
  }

  insertColumnAt(x: number): void {
    const self = this.getWritable()
    const rows = self.__rows
    for (let y = 0; y < rows.length; y++) {
      const row = rows[y]
      const cells = row.cells
      const cellsClone = Array.from(cells)
      const rowClone = { ...row, cells: cellsClone }
      const type = (cells[x] || cells[x - 1]).type
      cellsClone.splice(x, 0, createCell(type))
      rows[y] = rowClone
    }
  }

  deleteColumnAt(x: number): void {
    const self = this.getWritable()
    const rows = self.__rows
    for (let y = 0; y < rows.length; y++) {
      const row = rows[y]
      const cells = row.cells
      const cellsClone = Array.from(cells)
      const rowClone = { ...row, cells: cellsClone }
      cellsClone.splice(x, 1)
      rows[y] = rowClone
    }
  }

  addColumns(count: number): void {
    const self = this.getWritable()
    const rows = self.__rows
    for (let y = 0; y < rows.length; y++) {
      const row = rows[y]
      const cells = row.cells
      const cellsClone = Array.from(cells)
      const rowClone = { ...row, cells: cellsClone }
      const type = cells[cells.length - 1].type
      for (let x = 0; x < count; x++) {
        cellsClone.push(createCell(type))
      }
      rows[y] = rowClone
    }
  }

  insertRowAt(y: number): void {
    const self = this.getWritable()
    const rows = self.__rows
    const prevRow = rows[y] || rows[y - 1]
    const cellCount = prevRow.cells.length
    const row = createRow()
    for (let x = 0; x < cellCount; x++) {
      const cell = createCell(prevRow.cells[x].type)
      row.cells.push(cell)
    }
    rows.splice(y, 0, row)
  }

  deleteRowAt(y: number): void {
    const self = this.getWritable()
    const rows = self.__rows
    rows.splice(y, 1)
  }

  addRows(count: number): void {
    const self = this.getWritable()
    const rows = self.__rows
    const prevRow = rows[rows.length - 1]
    const cellCount = prevRow.cells.length

    for (let y = 0; y < count; y++) {
      const row = createRow()
      for (let x = 0; x < cellCount; x++) {
        const cell = createCell(prevRow.cells[x].type)
        row.cells.push(cell)
      }
      rows.push(row)
    }
  }

  decorate(_: LexicalEditor, _config: EditorConfig): JSX.Element {
    return (
      <table className="whitespace-normal">
        <tbody>
          {this.__mdastNode.children.map((row, index) => {
            return (
              <tr key={index}>
                {row.children.map((cell, index) => {
                  return <Cell key={index} mdastNode={cell} />
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    )
  }

  isInline(): false {
    return false
  }
}

function Cell({ mdastNode }: { mdastNode: Mdast.TableCell }) {
  const [isEditing, setIsEditing] = React.useState(false)
  const [cell, setCell] = React.useState(mdastNode)
  const createLexicalEditor = React.useCallback(() => {
    const editor = createEditor({
      nodes: UsedLexicalNodes,
      theme: theme,
    })

    editor.update(() => {
      importMdastTreeToLexical($getRoot(), { type: 'root', children: [{ type: 'paragraph', children: cell.children }] })
    })

    const unsub = editor.registerUpdateListener(() => {
      unsub()
      setTimeout(() => {
        editor.update(() => {
          console.log($getRoot()?.select())
          // $getRoot()?.getFirstChild()?.select()
        })
      }, 100)
    })

    editor.registerRootListener((element) => {
      element?.addEventListener('blur', () => {
        editor.getEditorState().read(() => {
          const mdast = exportLexicalTreeToMdast($getRoot(), LexicalVisitors, [])
          setCell((cell) => ({ ...cell, children: (mdast.children[0] as Mdast.Paragraph).children }))
          // setIsEditing(false)
        })
      })
    })

    return editor
  }, [cell])

  return (
    <td
      onClick={() => {
        setIsEditing(true)
      }}
    >
      {isEditing ? (
        <LexicalNestedComposer initialEditor={createLexicalEditor()}>
          <RichTextPlugin
            contentEditable={<ContentEditable className="prose font-sans max-w-none w-full focus:outline-none" autoFocus />}
            placeholder={<div></div>}
            ErrorBoundary={LexicalErrorBoundary}
          />
        </LexicalNestedComposer>
      ) : (
        <MarkdownAstRenderer mdastChildren={cell.children} />
      )}
    </td>
  )
}

export function $isTableNode(node: LexicalNode | null | undefined): node is TableNode {
  return node instanceof TableNode
}

export function $createTableNode(mdastNode: Mdast.Table): TableNode {
  return new TableNode(mdastNode)
}
