import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'
import { LexicalExtensionEditorComposer } from '@lexical/react/LexicalExtensionEditorComposer'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import * as RadixPopover from '@radix-ui/react-popover'
import {
  $createParagraphNode,
  $getNodeByKey,
  $getRoot,
  BLUR_COMMAND,
  COMMAND_PRIORITY_CRITICAL,
  COMMAND_PRIORITY_EDITOR,
  COMMAND_PRIORITY_LOW,
  FOCUS_COMMAND,
  KEY_ENTER_COMMAND,
  KEY_TAB_COMMAND,
  LexicalEditor,
  LexicalEditorWithDispose,
  NodeKey
} from 'lexical'
import * as Mdast from 'mdast'
import React, { ElementType } from 'react'
import { exportLexicalTreeToMdast } from '../../exportMarkdownFromLexical'
import { importMdastTreeToLexical } from '../../importMarkdownToLexical'
import { $isTableNode, TableNode } from './TableNode'

import { mergeRegister } from '@lexical/utils'
import * as RadixToolbar from '@radix-ui/react-toolbar'
import classNames from 'classnames'
import styles from '../../styles/ui.module.css'
import { isPartOftheEditorUI } from '../../utils/isPartOftheEditorUI'
import { uuidv4 } from '../../utils/uuid4'
import {
  NESTED_EDITOR_UPDATED_COMMAND,
  codeBlockEditorDescriptors$,
  defaultCodeBlockLanguage$,
  directiveDescriptors$,
  editorRootElementRef$,
  exportVisitors$,
  iconComponentFor$,
  importVisitors$,
  jsxComponentDescriptors$,
  jsxIsAvailable$,
  tableCellEditorChildren$,
  readOnly$,
  rootEditor$,
  useTranslation,
  usedLexicalNodes$
} from '../core'
import { useCellValues } from '@mdxeditor/gurx'
import { createExtensionEditor } from '../core/lexicalExtensions'

/**
 * Returns the element type for the cell based on the rowIndex
 *
 * If the rowIndex is 0, it returns 'th' for the header cell
 * Otherwise, it returns 'td' for the data cell
 */
const getCellType = (rowIndex: number): ElementType => {
  if (rowIndex === 0) {
    return 'th'
  }
  return 'td'
}

const AlignToTailwindClassMap = {
  center: styles.centeredCell,
  left: styles.leftAlignedCell,
  right: styles.rightAlignedCell
}

function $getTableNodeByKey(key: NodeKey): TableNode | null {
  const node = $getNodeByKey(key)
  return $isTableNode(node) ? node : null
}

export interface TableEditorProps {
  parentEditor: LexicalEditor
  lexicalTable: TableNode
  mdastNode: Mdast.Table
}

export const TableEditor: React.FC<TableEditorProps> = ({ mdastNode, parentEditor, lexicalTable }) => {
  const tableKey = lexicalTable.getKey()
  const [activeCell, setActiveCell] = React.useState<[number, number] | null>(null)
  const [iconComponentFor, readOnly] = useCellValues(iconComponentFor$, readOnly$)
  const getCellKey = React.useMemo(() => {
    return (cell: Mdast.TableCell & { __cacheKey?: string }) => {
      cell.__cacheKey ??= uuidv4()
      return cell.__cacheKey
    }
  }, [])

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
        setActiveCell(null)
        parentEditor.update(() => {
          const currentTable = $getTableNodeByKey(tableKey)
          if (!currentTable) {
            return
          }
          const nextSibling = currentTable.getNextSibling()
          if (nextSibling) {
            currentTable.selectNext()
          } else {
            const newParagraph = $createParagraphNode()
            currentTable.insertAfter(newParagraph)
            newParagraph.select()
          }
        })
        return
      }

      if (rowIndex < 0) {
        setActiveCell(null)
        parentEditor.update(() => {
          $getTableNodeByKey(tableKey)?.selectPrevious()
        })
        return
      }

      setActiveCell([colIndex, rowIndex])
    },
    [lexicalTable, parentEditor, tableKey]
  )
  React.useEffect(() => {
    lexicalTable.focusEmitter.subscribe(setActiveCellWithBoundaries)
  }, [lexicalTable, setActiveCellWithBoundaries])

  const addRowToBottom = React.useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      parentEditor.update(() => {
        const currentTable = $getTableNodeByKey(tableKey)
        if (!currentTable) {
          return
        }
        currentTable.addRowToBottom()
        setActiveCell([0, currentTable.getRowCount()])
      })
    },
    [parentEditor, tableKey]
  )

  // adds column to the right and focuses the top cell of it
  const addColumnToRight = React.useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      parentEditor.update(() => {
        const currentTable = $getTableNodeByKey(tableKey)
        if (!currentTable) {
          return
        }
        currentTable.addColumnToRight()
        setActiveCell([currentTable.getColCount(), 0])
      })
    },
    [parentEditor, tableKey]
  )

  const [highlightedCoordinates, setHighlightedCoordinates] = React.useState<[number, number]>([-1, -1])

  const onTableMouseOver = React.useCallback((e: React.MouseEvent<HTMLTableElement>) => {
    let tableCell = e.target as HTMLElement | null

    while (tableCell && !['TH', 'TD'].includes(tableCell.tagName)) {
      if (tableCell === e.currentTarget) {
        return
      }

      tableCell = tableCell.parentElement
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

  const t = useTranslation()

  // remove tool cols in readOnly mode
  return (
    <table
      className={styles.tableEditor}
      onMouseOver={onTableMouseOver}
      onMouseLeave={() => {
        setHighlightedCoordinates([-1, -1])
      }}
    >
      <colgroup>
        {readOnly ? null : <col />}

        {Array.from({ length: mdastNode.children[0].children.length }, (_, colIndex) => {
          const align = mdastNode.align ?? []
          const currentColumnAlign = align[colIndex] ?? 'left'
          const className = AlignToTailwindClassMap[currentColumnAlign]
          return <col key={colIndex} className={className} />
        })}

        {readOnly ? null : <col />}
      </colgroup>

      {readOnly || (
        <thead>
          <tr>
            <th className={styles.tableToolsColumn}></th>
            {Array.from({ length: mdastNode.children[0].children.length }, (_, colIndex) => {
              return (
                <th key={colIndex} data-tool-cell={true}>
                  <ColumnEditor
                    {...{
                      setActiveCellWithBoundaries,
                      parentEditor,
                      colIndex,
                      highlightedCoordinates,
                      lexicalTable,
                      align: (mdastNode.align ?? [])[colIndex]
                    }}
                  />
                </th>
              )
            })}

            <th className={styles.tableToolsColumn} data-tool-cell={true}>
              <button
                className={styles.iconButton}
                type="button"
                title={t('table.deleteTable', 'Delete table')}
                onClick={(e) => {
                  e.preventDefault()
                  parentEditor.update(() => {
                    const currentTable = $getTableNodeByKey(tableKey)
                    if (!currentTable) {
                      return
                    }
                    currentTable.selectNext()
                    currentTable.remove()
                  })
                }}
              >
                {iconComponentFor('delete_small')}
              </button>
            </th>
          </tr>
        </thead>
      )}

      <tbody>
        {mdastNode.children.map((row, rowIndex) => {
          const CellElement = getCellType(rowIndex)
          return (
            <tr key={rowIndex}>
              {readOnly || (
                <CellElement className={styles.toolCell} data-tool-cell={true}>
                  <RowEditor {...{ setActiveCellWithBoundaries, parentEditor, rowIndex, highlightedCoordinates, lexicalTable }} />
                </CellElement>
              )}
              {row.children.map((mdastCell, colIndex) => {
                return (
                  <Cell
                    align={mdastNode.align?.[colIndex]}
                    key={getCellKey(mdastCell)}
                    contents={mdastCell.children}
                    setActiveCell={setActiveCellWithBoundaries}
                    {...{
                      rowIndex,
                      colIndex,
                      lexicalTable,
                      parentEditor,
                      activeCell: readOnly ? [-1, -1] : activeCell
                    }}
                  />
                )
              })}
              {readOnly ||
                (rowIndex === 0 && (
                  <th rowSpan={lexicalTable.getRowCount()} data-tool-cell={true}>
                    <button type="button" className={styles.addColumnButton} onClick={addColumnToRight}>
                      {iconComponentFor('add_column')}
                    </button>
                  </th>
                ))}
            </tr>
          )
        })}
      </tbody>
      {readOnly || (
        <tfoot>
          <tr>
            <th></th>
            <th colSpan={lexicalTable.getColCount()} data-tool-cell={true}>
              <button type="button" className={styles.addRowButton} onClick={addRowToBottom}>
                {iconComponentFor('add_row')}
              </button>
            </th>
            <th></th>
          </tr>
        </tfoot>
      )}
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
  activeCell: [number, number] | null
  setActiveCell: (cell: [number, number] | null) => void
  focus: boolean
}

const Cell: React.FC<Omit<CellProps, 'focus'>> = ({ align, ...props }) => {
  const { activeCell, setActiveCell } = props
  const isActive = activeCell?.[0] === props.colIndex && activeCell[1] === props.rowIndex

  const className = AlignToTailwindClassMap[align ?? 'left']

  const CellElement = getCellType(props.rowIndex)

  return (
    <CellElement
      className={className}
      data-active={isActive}
      onClick={() => {
        setActiveCell([props.colIndex, props.rowIndex])
      }}
    >
      <CellEditor {...props} focus={isActive} />
    </CellElement>
  )
}

const CellEditor: React.FC<CellProps> = ({ focus, setActiveCell, parentEditor, lexicalTable, contents, colIndex, rowIndex }) => {
  const tableKey = lexicalTable.getKey()
  const [
    importVisitors,
    exportVisitors,
    usedLexicalNodes,
    jsxComponentDescriptors,
    directiveDescriptors,
    codeBlockEditorDescriptors,
    defaultCodeBlockLanguage,
    jsxIsAvailable,
    rootEditor,
    tableCellEditorChildren
  ] = useCellValues(
    importVisitors$,
    exportVisitors$,
    usedLexicalNodes$,
    jsxComponentDescriptors$,
    directiveDescriptors$,
    codeBlockEditorDescriptors$,
    defaultCodeBlockLanguage$,
    jsxIsAvailable$,
    rootEditor$,
    tableCellEditorChildren$
  )

  const [editor, setEditor] = React.useState<LexicalEditorWithDispose | null>(null)

  React.useEffect(() => {
    const editor = createExtensionEditor({
      name: '@mdxeditor/table-cell',
      nodes: usedLexicalNodes,
      namespace: 'TableCellEditor',
      parentEditor,
      historyMode: 'table-local',
      initialEditorState: () => {
        importMdastTreeToLexical({
          root: $getRoot(),
          mdastRoot: { type: 'root', children: [{ type: 'paragraph', children: contents }] },
          visitors: importVisitors,
          jsxComponentDescriptors,
          directiveDescriptors,
          codeBlockEditorDescriptors,
          defaultCodeBlockLanguage
        })
      }
    })
    setEditor(editor)
    return () => {
      editor.dispose()
    }
    // The editor owns the complete mount-time plugin/configuration snapshot.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const saveAndFocus = React.useCallback(
    (nextCell: [number, number] | null) => {
      if (!editor) {
        return
      }
      editor.getEditorState().read(() => {
        const mdast = exportLexicalTreeToMdast({
          root: $getRoot(),
          jsxComponentDescriptors,
          visitors: exportVisitors,
          jsxIsAvailable
        })
        parentEditor.update(
          () => {
            const currentTable = $getTableNodeByKey(tableKey)
            if (!currentTable) {
              return
            }
            currentTable.updateCellContents(colIndex, rowIndex, (mdast.children[0] as Mdast.Paragraph).children)
          },
          { discrete: true }
        )
        parentEditor.dispatchCommand(NESTED_EDITOR_UPDATED_COMMAND, undefined)
      })
      setActiveCell(nextCell)
    },
    [colIndex, editor, exportVisitors, jsxComponentDescriptors, jsxIsAvailable, parentEditor, rowIndex, setActiveCell, tableKey]
  )

  React.useEffect(() => {
    if (!editor) {
      return
    }
    return mergeRegister(
      editor.registerCommand(
        KEY_TAB_COMMAND,
        (payload) => {
          payload.preventDefault()
          const nextCell: [number, number] = payload.shiftKey ? [colIndex - 1, rowIndex] : [colIndex + 1, rowIndex]
          saveAndFocus(nextCell)
          return true
        },
        COMMAND_PRIORITY_CRITICAL
      ),

      editor.registerCommand(
        FOCUS_COMMAND,
        () => {
          setActiveCell([colIndex, rowIndex])
          return false
        },
        COMMAND_PRIORITY_LOW
      ),

      editor.registerCommand(
        KEY_ENTER_COMMAND,
        (payload) => {
          payload?.preventDefault()
          const nextCell: [number, number] = payload?.shiftKey ? [colIndex, rowIndex - 1] : [colIndex, rowIndex + 1]
          saveAndFocus(nextCell)
          return true
        },
        COMMAND_PRIORITY_CRITICAL
      ),

      editor.registerCommand(
        BLUR_COMMAND,
        (payload) => {
          const relatedTarget = payload.relatedTarget as HTMLElement | null

          if (isPartOftheEditorUI(relatedTarget, rootEditor!.getRootElement()!)) {
            return false
          }
          saveAndFocus(null)
          return true
        },
        COMMAND_PRIORITY_EDITOR
      ),

      editor.registerCommand(
        NESTED_EDITOR_UPDATED_COMMAND,
        () => {
          saveAndFocus(null)
          return true
        },
        COMMAND_PRIORITY_EDITOR
      )
    )
  }, [colIndex, editor, rootEditor, rowIndex, saveAndFocus, setActiveCell])

  React.useEffect(() => {
    if (focus && editor) {
      editor.focus()
    }
  }, [focus, editor])

  if (!editor) {
    return null
  }

  return (
    <LexicalExtensionEditorComposer initialEditor={editor}>
      <RichTextPlugin contentEditable={<ContentEditable />} placeholder={<div></div>} ErrorBoundary={LexicalErrorBoundary} />

      {tableCellEditorChildren.map((Child, index) => (
        <Child key={index} />
      ))}
    </LexicalExtensionEditorComposer>
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
  setActiveCellWithBoundaries
}) => {
  const tableKey = lexicalTable.getKey()
  const [editorRootElementRef, iconComponentFor] = useCellValues(editorRootElementRef$, iconComponentFor$)
  const [open, setOpen] = React.useState(false)

  const insertColumnAt = React.useCallback(
    (colIndex: number) => {
      setOpen(false)
      setTimeout(() => {
        parentEditor.update(() => {
          const currentTable = $getTableNodeByKey(tableKey)
          if (!currentTable) {
            return
          }
          currentTable.insertColumnAt(colIndex)
          setActiveCellWithBoundaries([colIndex, 0])
        })
      }, 0)
    },
    [parentEditor, setActiveCellWithBoundaries, tableKey]
  )

  const deleteColumnAt = React.useCallback(
    (colIndex: number) => {
      parentEditor.update(() => {
        $getTableNodeByKey(tableKey)?.deleteColumnAt(colIndex)
      })
    },
    [parentEditor, tableKey]
  )

  const setColumnAlign = React.useCallback(
    (colIndex: number, align: Mdast.AlignType) => {
      parentEditor.update(() => {
        $getTableNodeByKey(tableKey)?.setColumnAlign(colIndex, align)
      })
    },
    [parentEditor, tableKey]
  )

  const t = useTranslation()
  return (
    <RadixPopover.Root open={open} onOpenChange={setOpen}>
      <RadixPopover.PopoverTrigger
        className={styles.tableColumnEditorTrigger}
        data-active={highlightedCoordinates[0] === colIndex + 1}
        title={t('table.columnMenu', 'Column menu')}
      >
        {iconComponentFor('more_horiz')}
      </RadixPopover.PopoverTrigger>
      <RadixPopover.Portal container={editorRootElementRef?.current}>
        <RadixPopover.PopoverContent
          className={classNames(styles.tableColumnEditorPopoverContent)}
          onOpenAutoFocus={(e) => {
            e.preventDefault()
          }}
          sideOffset={5}
          side="top"
        >
          <RadixToolbar.Root className={styles.tableColumnEditorToolbar}>
            <RadixToolbar.ToggleGroup
              className={styles.toggleGroupRoot}
              onValueChange={(value) => {
                setColumnAlign(colIndex, value as Mdast.AlignType)
              }}
              value={align ?? 'left'}
              type="single"
              aria-label={t('table.textAlignment', 'Text alignment')}
            >
              <RadixToolbar.ToggleItem value="left" title={t('table.alignLeft', 'Align left')}>
                {iconComponentFor('format_align_left')}
              </RadixToolbar.ToggleItem>
              <RadixToolbar.ToggleItem value="center" title={t('table.alignCenter', 'Align center')}>
                {iconComponentFor('format_align_center')}
              </RadixToolbar.ToggleItem>
              <RadixToolbar.ToggleItem value="right" title={t('table.alignRight', 'Align right')}>
                {iconComponentFor('format_align_right')}
              </RadixToolbar.ToggleItem>
            </RadixToolbar.ToggleGroup>
            <RadixToolbar.Separator />
            <RadixToolbar.Button
              onClick={insertColumnAt.bind(null, colIndex)}
              title={t('table.insertColumnLeft', 'Insert a column to the left of this one')}
            >
              {iconComponentFor('insert_col_left')}
            </RadixToolbar.Button>
            <RadixToolbar.Button
              onClick={insertColumnAt.bind(null, colIndex + 1)}
              title={t('table.insertColumnRight', 'Insert a column to the right of this one')}
            >
              {iconComponentFor('insert_col_right')}
            </RadixToolbar.Button>
            <RadixToolbar.Button onClick={deleteColumnAt.bind(null, colIndex)} title={t('table.deleteColumn', 'Delete this column')}>
              {iconComponentFor('delete_small')}
            </RadixToolbar.Button>
          </RadixToolbar.Root>
          <RadixPopover.Arrow className={styles.popoverArrow} />
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
  setActiveCellWithBoundaries
}) => {
  const tableKey = lexicalTable.getKey()
  const [editorRootElementRef, iconComponentFor] = useCellValues(editorRootElementRef$, iconComponentFor$)

  const insertRowAt = React.useCallback(
    (rowIndex: number) => {
      parentEditor.update(() => {
        const currentTable = $getTableNodeByKey(tableKey)
        if (!currentTable) {
          return
        }
        currentTable.insertRowAt(rowIndex)
        setActiveCellWithBoundaries([0, rowIndex])
      })
    },
    [parentEditor, setActiveCellWithBoundaries, tableKey]
  )

  const deleteRowAt = React.useCallback(
    (rowIndex: number) => {
      parentEditor.update(() => {
        $getTableNodeByKey(tableKey)?.deleteRowAt(rowIndex)
      })
    },
    [parentEditor, tableKey]
  )

  const t = useTranslation()
  return (
    <RadixPopover.Root>
      <RadixPopover.PopoverTrigger
        className={styles.tableColumnEditorTrigger}
        data-active={highlightedCoordinates[1] === rowIndex}
        title={t('table.rowMenu', 'Row menu')}
      >
        {iconComponentFor('more_horiz')}
      </RadixPopover.PopoverTrigger>
      <RadixPopover.Portal container={editorRootElementRef?.current}>
        <RadixPopover.PopoverContent
          className={classNames(styles.tableColumnEditorPopoverContent)}
          onOpenAutoFocus={(e) => {
            e.preventDefault()
          }}
          sideOffset={5}
          side="bottom"
        >
          <RadixToolbar.Root className={styles.tableColumnEditorToolbar}>
            <RadixToolbar.Button
              onClick={insertRowAt.bind(null, rowIndex)}
              title={t('table.insertRowAbove', 'Insert a row above this one')}
            >
              {iconComponentFor('insert_row_above')}
            </RadixToolbar.Button>
            <RadixToolbar.Button
              onClick={insertRowAt.bind(null, rowIndex + 1)}
              title={t('table.insertRowBelow', 'Insert a row below this one')}
            >
              {iconComponentFor('insert_row_below')}
            </RadixToolbar.Button>
            <RadixToolbar.Button onClick={deleteRowAt.bind(null, rowIndex)} title={t('table.deleteRow', 'Delete this row')}>
              {iconComponentFor('delete_small')}
            </RadixToolbar.Button>
          </RadixToolbar.Root>
          <RadixPopover.Arrow className={styles.popoverArrow} />
        </RadixPopover.PopoverContent>
      </RadixPopover.Portal>
    </RadixPopover.Root>
  )
}
