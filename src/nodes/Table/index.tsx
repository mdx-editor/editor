import {
  $getRoot,
  BLUR_COMMAND,
  COMMAND_PRIORITY_CRITICAL,
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  EditorConfig,
  KEY_ENTER_COMMAND,
  KEY_TAB_COMMAND,
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

// function convertTableElement(domNode: HTMLElement): null | DOMConversionOutput {
//   const rowElems = domNode.querySelectorAll('tr')
//   if (!rowElems || rowElems.length === 0) {
//     return null
//   }
//   const rows: Rows = []
//   for (let y = 0; y < rowElems.length; y++) {
//     const rowElem = rowElems[y]
//     const cellElems = rowElem.querySelectorAll('td,th')
//     if (!cellElems || cellElems.length === 0) {
//       continue
//     }
//     const cells: Array<Cell> = []
//     for (let x = 0; x < cellElems.length; x++) {
//       const cellElem = cellElems[x] as HTMLElement
//       const isHeader = cellElem.nodeName === 'TH'
//       const cell = createCell(isHeader ? 'header' : 'normal')
//       cell.json = plainTextEditorJSON(JSON.stringify(cellElem.innerText.replace(/\n/g, ' ')))
//       cells.push(cell)
//     }
//     const row = createRow()
//     row.cells = cells
//     rows.push(row)
//   }
//   return { node: $createTableNode() }
// }

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

const EMPTY_CELL: Mdast.TableCell = { type: 'tableCell', children: [] as Mdast.PhrasingContent[] }

export class TableNode extends DecoratorNode<JSX.Element> {
  __rows: Rows = []
  __mdastNode: Mdast.Table

  static getType(): string {
    return 'table'
  }

  static clone(node: TableNode): TableNode {
    return new TableNode(Object.assign({}, node.__mdastNode), node.__key)
  }

  // static importDOM(): DOMConversionMap | null {
  //   return {
  //     table: (_node: Node) => ({
  //       conversion: convertTableElement,
  //       priority: 0,
  //     }),
  //   }
  // }

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

  exportDOM(): DOMExportOutput {
    return { element: exportTableCellsToHTML(this.__rows) }
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
      cellsClone.splice(colIndex, 0, EMPTY_CELL)
      table.children[rowIndex] = rowClone
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
      children: Array.from({ length: this.getColCount() }, () => EMPTY_CELL),
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

  decorate(parentEditor: LexicalEditor, _config: EditorConfig): JSX.Element {
    return <TableComponent lexicalTable={this} mdastNode={this.__mdastNode} parentEditor={parentEditor} />
  }

  isInline(): false {
    return false
  }
}

interface TableProps {
  parentEditor: LexicalEditor
  lexicalTable: TableNode
  mdastNode: Mdast.Table
}

const AlignToTailwindClassMap = {
  center: 'text-center',
  left: 'text-left',
  right: 'text-right',
}

const TableComponent: React.FC<TableProps> = ({ mdastNode, parentEditor, lexicalTable }) => {
  const [activeCell, setActiveCell] = React.useState<[number, number] | null>(null)

  const setActiveCellWithBoundaries = React.useCallback(
    (cell: [number, number] | null) => {
      const colCount = lexicalTable.getColCount()
      if (cell === null) {
        setActiveCell(null)
        return
      }
      let [colIndex, rowIndex] = cell

      // overflow columns
      if (colIndex > colCount - 1) {
        colIndex = 0
        rowIndex++
      }

      // underflow columns
      if (colIndex < 0) {
        colIndex = colCount - 1
        rowIndex -= 1
      }

      if (rowIndex > lexicalTable.getRowCount() - 1) {
        //TODO: focus on the next editor
        return
      }

      if (rowIndex < 0) {
        //TODO: focus on the previous editor
        return
      }

      setActiveCell([colIndex, rowIndex])
    },
    [lexicalTable]
  )

  const addRowToBottom = React.useCallback(() => {
    parentEditor.update(() => {
      lexicalTable.addRowToBottom()
    })
    setActiveCellWithBoundaries([0, lexicalTable.getRowCount() - 1])
  }, [parentEditor, lexicalTable, setActiveCellWithBoundaries])

  // adds column to the right and focuses the top cell of it
  const addColumnToRight = React.useCallback(() => {
    parentEditor.update(() => {
      lexicalTable.addColumnToRight()
    })
    setActiveCellWithBoundaries([lexicalTable.getColCount() - 1, 0])
  }, [parentEditor, lexicalTable, setActiveCellWithBoundaries])

  const insertColumnAt = React.useCallback(
    (colIndex: number) => {
      parentEditor.update(() => {
        lexicalTable.insertColumnAt(colIndex)
      })
      setActiveCellWithBoundaries([colIndex, 0])
    },
    [parentEditor, lexicalTable, setActiveCellWithBoundaries]
  )

  const insertRowAt = React.useCallback(
    (rowIndex: number) => {
      parentEditor.update(() => {
        lexicalTable.insertRowAt(rowIndex)
      })
      setActiveCellWithBoundaries([0, rowIndex])
    },
    [parentEditor, lexicalTable, setActiveCellWithBoundaries]
  )

  const deleteRowAt = React.useCallback(
    (rowIndex: number) => {
      parentEditor.update(() => {
        lexicalTable.deleteRowAt(rowIndex)
      })
    },
    [parentEditor, lexicalTable]
  )

  const deleteColumnAt = React.useCallback(
    (colIndex: number) => {
      parentEditor.update(() => {
        lexicalTable.deleteColumnAt(colIndex)
      })
    },
    [parentEditor, lexicalTable]
  )

  const setColumnAlign = React.useCallback(
    (colIndex: number, align: Mdast.AlignType) => {
      parentEditor.update(() => {
        lexicalTable.setColumnAlign(colIndex, align)
      })
    },
    [parentEditor, lexicalTable]
  )

  const [highlightedCoordinates, setHighlightedCoordinates] = React.useState<[number, number]>([-1, -1])

  const onTableMouseOver = React.useCallback((e: React.MouseEvent<HTMLTableElement>) => {
    let tableCell = e.target as HTMLElement

    while (!['TH', 'TD'].includes(tableCell.tagName)) {
      if (tableCell === e.currentTarget) {
        return
      }

      tableCell = tableCell.parentElement!
    }
    const tableRow = tableCell.parentElement!
    const tableContainer = tableRow.parentElement!
    const colIndex = tableContainer.tagName === 'TFOOT' ? -1 : Array.from(tableRow.children).indexOf(tableCell)
    const rowIndex = tableCell.tagName === 'TH' ? -1 : Array.from(tableRow.parentElement!.children).indexOf(tableRow)
    setHighlightedCoordinates([colIndex, rowIndex])
  }, [])

  return (
    <table
      className="whitespace-normal my-0 table-fixed h-max not-prose"
      onMouseOver={onTableMouseOver}
      onMouseLeave={() => setHighlightedCoordinates([-1, -1])}
    >
      <colgroup>
        <col />

        {Array.from({ length: mdastNode.children[0].children.length }, (_, colIndex) => {
          const align = mdastNode.align || []
          const currentColumnAlign = align[colIndex] || 'left'
          const className = AlignToTailwindClassMap[currentColumnAlign]
          return <col key={colIndex} className={className} />
        })}
        <col />
      </colgroup>

      <thead>
        <tr>
          <th className="w-28"></th>
          {Array.from({ length: mdastNode.children[0].children.length }, (_, colIndex) => {
            return (
              <th key={colIndex}>
                <div className="flex gap-3 invisible data-[active=true]:visible" data-active={highlightedCoordinates[0] === colIndex + 1}>
                  <button className="bg-slate-100" onClick={setColumnAlign.bind(null, colIndex, 'left')}>
                    l
                  </button>
                  <button className="bg-slate-100" onClick={setColumnAlign.bind(null, colIndex, 'center')}>
                    c
                  </button>
                  <button className="bg-slate-100" onClick={setColumnAlign.bind(null, colIndex, 'right')}>
                    r
                  </button>

                  <button className="bg-slate-100" onClick={insertColumnAt.bind(null, colIndex)}>
                    +o
                  </button>
                  <button className="bg-slate-100" onClick={deleteColumnAt.bind(null, colIndex)}>
                    -
                  </button>

                  <button className="bg-slate-100" onClick={insertColumnAt.bind(null, colIndex + 1)}>
                    o+
                  </button>
                </div>
              </th>
            )
          })}
          <th className="w-12"></th>
        </tr>
      </thead>

      <tbody>
        {mdastNode.children.map((row, rowIndex) => {
          return (
            <tr key={rowIndex}>
              <td>
                <div className="flex gap-3 invisible data-[active=true]:visible" data-active={highlightedCoordinates[1] === rowIndex}>
                  <button className="bg-slate-100" onClick={insertRowAt.bind(null, rowIndex)}>
                    +o
                  </button>
                  <button className="bg-slate-100" onClick={deleteRowAt.bind(null, rowIndex)}>
                    -
                  </button>

                  <button className="bg-slate-100" onClick={insertRowAt.bind(null, rowIndex + 1)}>
                    o+
                  </button>
                </div>
              </td>
              {row.children.map((mdastCell, colIndex) => {
                return (
                  <Cell
                    align={mdastNode.align?.[colIndex]}
                    key={colIndex}
                    contents={mdastCell.children}
                    {...{ rowIndex, colIndex, lexicalTable, parentEditor, activeCellTuple: [activeCell, setActiveCellWithBoundaries] }}
                  />
                )
              })}
              {rowIndex === 0 && (
                <td rowSpan={lexicalTable.getRowCount()}>
                  <button className="bg-slate-100 h-full overflow-auto block p-4" onClick={addColumnToRight}>
                    +
                  </button>
                </td>
              )}
            </tr>
          )
        })}
      </tbody>
      <tfoot>
        <tr>
          <th></th>
          <th colSpan={lexicalTable.getColCount()}>
            <button className="bg-slate-100 w-full block p-4" onClick={addRowToBottom}>
              +
            </button>
          </th>
          <th></th>
        </tr>
      </tfoot>
    </table>
  )
}

export interface CellProps {
  parentEditor: LexicalEditor
  lexicalTable: TableNode
  contents: Mdast.PhrasingContent[]
  colIndex: number
  rowIndex: number
  align?: Mdast.AlignType
  activeCellTuple: [[number, number] | null, (cell: [number, number] | null) => void]
}

const Cell: React.FC<CellProps> = ({ align, ...props }) => {
  const [activeCell, setActiveCell] = props.activeCellTuple
  const isActive = activeCell && activeCell[0] === props.colIndex && activeCell[1] === props.rowIndex

  const className = AlignToTailwindClassMap[align || 'left']
  return (
    <td
      className={className}
      onClick={() => {
        setActiveCell([props.colIndex, props.rowIndex])
      }}
    >
      {isActive ? <CellEditor {...props} /> : <MarkdownAstRenderer mdastChildren={props.contents} />}
    </td>
  )
}

const CellEditor: React.FC<CellProps> = ({ activeCellTuple, parentEditor, lexicalTable, contents, colIndex, rowIndex }) => {
  const [editor] = React.useState(() => {
    let disposed = false
    const editor = createEditor({
      nodes: UsedLexicalNodes,
      theme: theme,
    })

    function saveAndDispose(nextCell: [number, number] | null) {
      if (disposed) {
        return
      }
      disposed = true
      editor.getEditorState().read(() => {
        const mdast = exportLexicalTreeToMdast($getRoot(), LexicalVisitors, [])
        parentEditor.update(() => {
          lexicalTable.updateCellContents(colIndex, rowIndex, (mdast.children[0] as Mdast.Paragraph).children)
        })
      })

      activeCellTuple[1](nextCell)
    }

    editor.registerCommand(
      KEY_TAB_COMMAND,
      (payload) => {
        payload.preventDefault()
        const nextCell: [number, number] = payload.shiftKey ? [colIndex - 1, rowIndex] : [colIndex + 1, rowIndex]
        saveAndDispose(nextCell)
        return true
      },
      COMMAND_PRIORITY_CRITICAL
    )

    editor.registerCommand(
      KEY_ENTER_COMMAND,
      (payload) => {
        payload?.preventDefault()
        const nextCell: [number, number] = payload?.shiftKey ? [colIndex, rowIndex - 1] : [colIndex, rowIndex + 1]
        saveAndDispose(nextCell)
        return true
      },
      COMMAND_PRIORITY_CRITICAL
    )

    editor.registerCommand(
      BLUR_COMMAND,
      (payload) => {
        const relatedTarget = payload.relatedTarget as HTMLElement | null
        if (relatedTarget?.dataset['editorDialog'] !== undefined) {
          return false
        }
        saveAndDispose(null)
        return true
      },
      COMMAND_PRIORITY_CRITICAL
    )

    editor.registerRootListener((element) => {
      if (element) {
        editor.focus()
      }
    })

    editor.update(() => {
      importMdastTreeToLexical($getRoot(), { type: 'root', children: [{ type: 'paragraph', children: contents }] })
    })

    return editor
  })

  return (
    <LexicalNestedComposer initialEditor={editor}>
      <RichTextPlugin
        contentEditable={<ContentEditable className="prose font-sans max-w-none w-full focus:outline-none text-sm" autoFocus />}
        placeholder={<div className="text-sm"></div>}
        ErrorBoundary={LexicalErrorBoundary}
      />
    </LexicalNestedComposer>
  )
}

export function $isTableNode(node: LexicalNode | null | undefined): node is TableNode {
  return node instanceof TableNode
}

export function $createTableNode(mdastNode: Mdast.Table): TableNode {
  return new TableNode(mdastNode)
}
