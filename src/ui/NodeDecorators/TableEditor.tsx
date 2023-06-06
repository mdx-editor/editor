import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary'
import { LexicalNestedComposer } from '@lexical/react/LexicalNestedComposer'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { $getRoot, BLUR_COMMAND, COMMAND_PRIORITY_CRITICAL, KEY_ENTER_COMMAND, KEY_TAB_COMMAND, LexicalEditor, createEditor } from 'lexical'
import * as Mdast from 'mdast'
import React from 'react'
import { theme } from '../../content/theme'
import { LexicalVisitors, exportLexicalTreeToMdast } from '../../export'
import { UsedLexicalNodes, importMdastTreeToLexical } from '../../import'
import { TableNode } from '../../nodes/Table'
import { TableEditorProps } from '../../types/NodeDecoratorsProps'
import { MarkdownAstRenderer } from '../MarkdownAstRenderer'
import * as RadixPopover from '@radix-ui/react-popover'
import { ReactComponent as MoreHorizIcon } from './icons/more_horiz.svg'
import { ReactComponent as AlignLeftIcon } from './icons/format_align_left.svg'
import { ReactComponent as AlignCenterIcon } from './icons/format_align_center.svg'
import { ReactComponent as AlignRightIcon } from './icons/format_align_right.svg'
import { ReactComponent as InsertColLeftIcon } from './icons/insert_col_left.svg'
import { ReactComponent as InsertColRightIcon } from './icons/insert_col_right.svg'
import { ReactComponent as DeleteSmallIcon } from './icons/delete_small.svg'
import { ReactComponent as InsertRowAboveIcon } from './icons/insert_row_above.svg'
import { ReactComponent as InsertRowBelowIcon } from './icons/insert_row_below.svg'
import { ReactComponent as AddRowIcon } from './icons/add_row.svg'
import { ReactComponent as AddColumnIcon } from './icons/add_column.svg'

import styles from '../styles.module.css'
import classNames from 'classnames'
import * as RadixToolbar from '@radix-ui/react-toolbar'

const AlignToTailwindClassMap = {
  center: styles.centeredCell,
  left: styles.leftAlignedCell,
  right: styles.rightAlignedCell,
}

export const TableEditor: React.FC<TableEditorProps> = ({ mdastNode, parentEditor, lexicalTable }) => {
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

  const [highlightedCoordinates, setHighlightedCoordinates] = React.useState<[number, number]>([-1, -1])

  const onTableMouseOver = React.useCallback((e: React.MouseEvent<HTMLTableElement>) => {
    let tableCell = e.target as HTMLElement

    while (tableCell && !['TH', 'TD'].includes(tableCell.tagName)) {
      if (tableCell === e.currentTarget) {
        return
      }

      tableCell = tableCell.parentElement!
    }
    if (tableCell === null) {
      return
    }
    const tableRow = tableCell.parentElement!
    const tableContainer = tableRow.parentElement!
    const colIndex = tableContainer.tagName === 'TFOOT' ? -1 : Array.from(tableRow.children).indexOf(tableCell)
    const rowIndex = tableCell.tagName === 'TH' ? -1 : Array.from(tableRow.parentElement!.children).indexOf(tableRow)
    setHighlightedCoordinates([colIndex, rowIndex])
  }, [])

  return (
    <table className={styles.tableEditor} onMouseOver={onTableMouseOver} onMouseLeave={() => setHighlightedCoordinates([-1, -1])}>
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
          <th className={styles.tableToolsColumn}></th>
          {Array.from({ length: mdastNode.children[0].children.length }, (_, colIndex) => {
            return (
              <th key={colIndex}>
                <ColumnEditor
                  {...{
                    setActiveCellWithBoundaries,
                    parentEditor,
                    colIndex,
                    highlightedCoordinates,
                    lexicalTable,
                    align: (mdastNode.align || [])[colIndex],
                  }}
                />
              </th>
            )
          })}
          <th className={styles.tableToolsColumn}></th>
        </tr>
      </thead>

      <tbody>
        {mdastNode.children.map((row, rowIndex) => {
          return (
            <tr key={rowIndex}>
              <td className={styles.toolCell}>
                <RowEditor {...{ setActiveCellWithBoundaries, parentEditor, rowIndex, highlightedCoordinates, lexicalTable }} />
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
                <th rowSpan={lexicalTable.getRowCount()}>
                  <button className={styles.addColumnButton} onClick={addColumnToRight}>
                    <AddColumnIcon />
                  </button>
                </th>
              )}
            </tr>
          )
        })}
      </tbody>
      <tfoot>
        <tr>
          <th></th>
          <th colSpan={lexicalTable.getColCount()}>
            <button className={styles.addRowButton} onClick={addRowToBottom}>
              <AddRowIcon />
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
      data-active={isActive}
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
      <RichTextPlugin contentEditable={<ContentEditable autoFocus />} placeholder={<div></div>} ErrorBoundary={LexicalErrorBoundary} />
    </LexicalNestedComposer>
  )
}

interface ColumnEditorProps {
  parentEditor: LexicalEditor
  lexicalTable: TableNode
  colIndex: number
  highlightedCoordinates: [number, number]
  setActiveCellWithBoundaries: (cell: [number, number] | null) => void
  align: Mdast.AlignType
}

const ColumnEditor: React.FC<ColumnEditorProps> = ({
  parentEditor,
  highlightedCoordinates,
  align,
  lexicalTable,
  colIndex,
  setActiveCellWithBoundaries,
}) => {
  const insertColumnAt = React.useCallback(
    (colIndex: number) => {
      parentEditor.update(() => {
        lexicalTable.insertColumnAt(colIndex)
      })
      setActiveCellWithBoundaries([colIndex, 0])
    },
    [parentEditor, lexicalTable, setActiveCellWithBoundaries]
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
  return (
    <RadixPopover.Root>
      <RadixPopover.PopoverTrigger className={styles.tableColumnEditorTrigger} data-active={highlightedCoordinates[0] === colIndex + 1}>
        <MoreHorizIcon />
      </RadixPopover.PopoverTrigger>
      <RadixPopover.Portal>
        <RadixPopover.PopoverContent
          className={classNames(styles.editorRoot, styles.tableColumnEditorPopoverContent)}
          onOpenAutoFocus={(e) => e.preventDefault()}
          sideOffset={5}
          side="top"
        >
          <RadixToolbar.Root className={styles.tableColumnEditorToolbar}>
            <RadixToolbar.ToggleGroup
              className={styles.toggleGroupRoot}
              onValueChange={(value) => {
                setColumnAlign(colIndex, value as Mdast.AlignType)
              }}
              value={align || 'left'}
              type="single"
              aria-label="Text alignment"
            >
              <RadixToolbar.ToggleItem value="left">
                <AlignLeftIcon />
              </RadixToolbar.ToggleItem>
              <RadixToolbar.ToggleItem value="center">
                <AlignCenterIcon />
              </RadixToolbar.ToggleItem>
              <RadixToolbar.ToggleItem value="right">
                <AlignRightIcon />
              </RadixToolbar.ToggleItem>
            </RadixToolbar.ToggleGroup>
            <RadixToolbar.Separator />
            <RadixToolbar.Button onClick={insertColumnAt.bind(null, colIndex)}>
              <InsertColLeftIcon />
            </RadixToolbar.Button>
            <RadixToolbar.Button onClick={insertColumnAt.bind(null, colIndex + 1)}>
              <InsertColRightIcon />
            </RadixToolbar.Button>
            <RadixToolbar.Button onClick={deleteColumnAt.bind(null, colIndex)}>
              <DeleteSmallIcon />
            </RadixToolbar.Button>
          </RadixToolbar.Root>
        </RadixPopover.PopoverContent>
      </RadixPopover.Portal>
    </RadixPopover.Root>
  )
}
interface RowEditorProps {
  parentEditor: LexicalEditor
  lexicalTable: TableNode
  rowIndex: number
  highlightedCoordinates: [number, number]
  setActiveCellWithBoundaries: (cell: [number, number] | null) => void
}

const RowEditor: React.FC<RowEditorProps> = ({
  parentEditor,
  highlightedCoordinates,
  lexicalTable,
  rowIndex,
  setActiveCellWithBoundaries,
}) => {
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

  return (
    <RadixPopover.Root>
      <RadixPopover.PopoverTrigger className={styles.tableColumnEditorTrigger} data-active={highlightedCoordinates[1] === rowIndex}>
        <MoreHorizIcon />
      </RadixPopover.PopoverTrigger>
      <RadixPopover.Portal>
        <RadixPopover.PopoverContent
          className={classNames(styles.editorRoot, styles.tableColumnEditorPopoverContent)}
          onOpenAutoFocus={(e) => e.preventDefault()}
          sideOffset={5}
          side="bottom"
        >
          <RadixToolbar.Root className={styles.tableColumnEditorToolbar}>
            <RadixToolbar.Button onClick={insertRowAt.bind(null, rowIndex)}>
              <InsertRowAboveIcon />
            </RadixToolbar.Button>
            <RadixToolbar.Button onClick={insertRowAt.bind(null, rowIndex + 1)}>
              <InsertRowBelowIcon />
            </RadixToolbar.Button>
            <RadixToolbar.Button onClick={deleteRowAt.bind(null, rowIndex)}>
              <DeleteSmallIcon />
            </RadixToolbar.Button>
          </RadixToolbar.Root>
        </RadixPopover.PopoverContent>
      </RadixPopover.Portal>
    </RadixPopover.Root>
  )
}
