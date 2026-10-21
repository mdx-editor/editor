import { getPeerDependencyFromEditor } from '@lexical/extension'
import { HistoryExtension } from '@lexical/history'
import { readTableClipboard } from './tableClipboard'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'
import { LexicalExtensionEditorComposer } from '@lexical/react/LexicalExtensionEditorComposer'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import * as RadixPopover from '@radix-ui/react-popover'
import {
  $createParagraphNode,
  $getNodeByKey,
  $getRoot,
  $getSelection,
  $isElementNode,
  $isRangeSelection,
  $isRootNode,
  BLUR_COMMAND,
  CAN_UNDO_COMMAND,
  CAN_REDO_COMMAND,
  HISTORY_PUSH_TAG,
  HISTORIC_TAG,
  PASTE_COMMAND,
  UNDO_COMMAND,
  REDO_COMMAND,
  COMMAND_PRIORITY_CRITICAL,
  COMMAND_PRIORITY_EDITOR,
  COMMAND_PRIORITY_LOW,
  DELETE_CHARACTER_COMMAND,
  DELETE_LINE_COMMAND,
  DELETE_WORD_COMMAND,
  FOCUS_COMMAND,
  KEY_ENTER_COMMAND,
  KEY_TAB_COMMAND,
  EditorState,
  LexicalEditor,
  LexicalEditorWithDispose,
  LexicalNode,
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
import { isMdastEqualIgnoringPositions } from '../../utils/mdastEquality'
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

// With nothing left to delete in a direction, Lexical measures the deletion with the native
// Selection.modify, which moves the DOM caret and focus into the neighboring cell editor.
// The two cells then bounce focus between each other, which can loop forever and freeze the page.
function $isCollapsedAtCellEdge(isBackward: boolean): boolean {
  const selection = $getSelection()
  if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
    return false
  }
  let node: LexicalNode | null = selection.anchor.getNode()
  const edgeOffset = isBackward ? 0 : $isElementNode(node) ? node.getChildrenSize() : node.getTextContentSize()
  if (selection.anchor.offset !== edgeOffset) {
    return false
  }
  while (node !== null && !$isRootNode(node)) {
    if ((isBackward ? node.getPreviousSibling() : node.getNextSibling()) !== null) {
      return false
    }
    node = node.getParent()
  }
  return true
}

export interface TableEditorProps {
  parentEditor: LexicalEditor
  lexicalTable: TableNode
  mdastNode: Mdast.Table
}

export const TableEditor: React.FC<TableEditorProps> = ({ mdastNode, parentEditor, lexicalTable }) => {
  const tableKey = lexicalTable.getKey()
  const [activeCell, setActiveCell] = React.useState<[number, number] | null>(null)
  const [cellEditors] = React.useState(() => new Set<LexicalEditor>())
  const [pasteHistoryStates] = React.useState(() => new WeakSet<EditorState>())
  React.useEffect(
    () =>
      parentEditor.registerUpdateListener(({ editorState, prevEditorState, tags }) => {
        // Preserve the paste branch through selection/history merges, but do not
        // carry it onto an older state restored by Undo or a new branch from it.
        if (!tags.has(HISTORIC_TAG) && pasteHistoryStates.has(prevEditorState)) pasteHistoryStates.add(editorState)
        if (tags.has(HISTORIC_TAG)) {
          const bounds = editorState.read(() => {
            const table = $getTableNodeByKey(tableKey)
            return table ? [table.getColCount(), table.getRowCount()] : [0, 0]
          })
          // Undo can remove the expansion cell the user focused after pasting.
          // Keep a valid cell active so the next keyboard Redo stays in the table.
          setActiveCell((current) => {
            if (!current || !bounds[0] || !bounds[1]) return null
            const next: [number, number] = [Math.min(current[0], bounds[0] - 1), Math.min(current[1], bounds[1] - 1)]
            return next[0] === current[0] && next[1] === current[1] ? current : next
          })
        }
      }),
    [parentEditor, pasteHistoryStates, tableKey]
  )
  const [iconComponentFor, readOnly] = useCellValues(iconComponentFor$, readOnly$)
  const getCellKey = React.useMemo(() => {
    return (cell: Mdast.TableCell & { __cacheKey?: string }) => {
      cell.__cacheKey ??= uuidv4()
      return cell.__cacheKey
    }
  }, [])

  const setActiveCellWithBoundaries = React.useCallback(
    (cell: [number, number] | null) => {
      // The lexicalTable prop lags behind structural changes until the next render.
      const [colCount, rowCount] = parentEditor.getEditorState().read(() => {
        const currentTable = $getTableNodeByKey(tableKey)
        return currentTable ? [currentTable.getColCount(), currentTable.getRowCount()] : [0, 0]
      })

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

      if (rowIndex > rowCount - 1) {
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
    [parentEditor, tableKey]
  )
  React.useEffect(() => {
    lexicalTable.focusEmitter.subscribe(setActiveCellWithBoundaries)
  }, [lexicalTable, setActiveCellWithBoundaries])

  const addRowToBottom = React.useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      let nextCell: [number, number] | null = null
      parentEditor.update(
        () => {
          const currentTable = $getTableNodeByKey(tableKey)
          if (!currentTable) {
            return
          }
          nextCell = [0, currentTable.getRowCount()]
          currentTable.addRowToBottom()
        },
        {
          onUpdate: () => {
            if (nextCell) {
              setActiveCell(nextCell)
            }
          }
        }
      )
    },
    [parentEditor, tableKey]
  )

  // adds column to the right and focuses the top cell of it
  const addColumnToRight = React.useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      let nextCell: [number, number] | null = null
      parentEditor.update(
        () => {
          const currentTable = $getTableNodeByKey(tableKey)
          if (!currentTable) {
            return
          }
          nextCell = [currentTable.getColCount(), 0]
          currentTable.addColumnToRight()
        },
        {
          onUpdate: () => {
            if (nextCell) {
              setActiveCell(nextCell)
            }
          }
        }
      )
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
                    cellEditors={cellEditors}
                    pasteHistoryStates={pasteHistoryStates}
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
  cellEditors: Set<LexicalEditor>
  pasteHistoryStates: WeakSet<EditorState>
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

const CellEditor: React.FC<CellProps> = ({
  focus,
  setActiveCell,
  parentEditor,
  lexicalTable,
  contents,
  colIndex,
  rowIndex,
  cellEditors,
  pasteHistoryStates
}) => {
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
    cellEditors.add(editor)
    setEditor(editor)
    return () => {
      cellEditors.delete(editor)
      editor.dispose()
    }
    // The editor owns the complete mount-time plugin/configuration snapshot.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // A replaced cell can still deliver a queued blur/upload callback. Only
  // save into the cell identity this editor was mounted for.
  const cellIdentity = React.useRef(lexicalTable.getMdastNode().children[rowIndex].children[colIndex])
  const persistedContents = React.useRef(contents)
  React.useEffect(() => {
    if (!editor || isMdastEqualIgnoringPositions(persistedContents.current, contents)) return
    persistedContents.current = contents
    const currentContents = editor
      .getEditorState()
      .read(
        () =>
          (
            exportLexicalTreeToMdast({ root: $getRoot(), jsxComponentDescriptors, visitors: exportVisitors, jsxIsAvailable })
              .children[0] as Mdast.Paragraph
          ).children
      )
    if (isMdastEqualIgnoringPositions(currentContents, contents)) return
    // Parent history may restore a cell without changing its cache identity.
    // Reconcile only changed persisted contents, never a rerender of unsaved typing.
    editor.update(
      () => {
        importMdastTreeToLexical({
          root: $getRoot().clear(),
          mdastRoot: { type: 'root', children: [{ type: 'paragraph', children: contents }] },
          visitors: importVisitors,
          jsxComponentDescriptors,
          directiveDescriptors,
          codeBlockEditorDescriptors,
          defaultCodeBlockLanguage
        })
        if (focus) $getRoot().selectEnd()
      },
      { discrete: true, tag: HISTORIC_TAG }
    )
    const history = getPeerDependencyFromEditor<typeof HistoryExtension>(editor, HistoryExtension.name)!.output.historyState.value
    history.undoStack = []
    history.redoStack = []
  }, [
    editor,
    contents,
    importVisitors,
    exportVisitors,
    jsxComponentDescriptors,
    jsxIsAvailable,
    directiveDescriptors,
    codeBlockEditorDescriptors,
    defaultCodeBlockLanguage,
    focus
  ])

  const save = React.useCallback(() => {
    if (!editor || !cellEditors.has(editor)) {
      return
    }
    const parentHistory = getPeerDependencyFromEditor<typeof HistoryExtension>(parentEditor, HistoryExtension.name)?.output.historyState
      .value
    if (parentHistory && !parentHistory.current) {
      parentHistory.current = { editor: parentEditor, editorState: parentEditor.getEditorState() }
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
          const currentCell = currentTable.getMdastNode().children.at(rowIndex)?.children.at(colIndex)
          if (
            !currentCell ||
            (currentCell as { __cacheKey?: string }).__cacheKey !== (cellIdentity.current as { __cacheKey?: string }).__cacheKey
          )
            return
          currentTable.updateCellContents(colIndex, rowIndex, (mdast.children[0] as Mdast.Paragraph).children)
        },
        { discrete: true }
      )
      parentEditor.dispatchCommand(NESTED_EDITOR_UPDATED_COMMAND, undefined)
    })
  }, [colIndex, editor, exportVisitors, jsxComponentDescriptors, jsxIsAvailable, parentEditor, rowIndex, tableKey, cellEditors])

  React.useEffect(() => {
    if (!editor) return
    const history = getPeerDependencyFromEditor<typeof HistoryExtension>(editor, HistoryExtension.name)!.output.historyState.value
    const parentHistory = getPeerDependencyFromEditor<typeof HistoryExtension>(parentEditor, HistoryExtension.name)?.output.historyState
      .value
    const hasPasteHistory = () =>
      Boolean(
        parentHistory &&
          [parentHistory.current, ...parentHistory.undoStack, ...parentHistory.redoStack].some(
            (entry) => entry && pasteHistoryStates.has(entry.editorState)
          )
      )
    const changesThisTable = (target: EditorState | undefined) => {
      if (!target || !hasPasteHistory()) return false
      const currentTable = parentEditor.getEditorState().read(() => $getTableNodeByKey(tableKey)?.getMdastNode())
      const targetTable = target.read(() => $getTableNodeByKey(tableKey)?.getMdastNode())
      return Boolean(currentTable && targetTable && !isMdastEqualIgnoringPositions(currentTable, targetTable))
    }
    const canUndoParent = () => changesThisTable(parentHistory?.undoStack.at(-1)?.editorState)
    const canRedoParent = () => history.undoStack.length === 0 && changesThisTable(parentHistory?.redoStack.at(-1)?.editorState)
    const publishAvailability = () => {
      if (focus) {
        editor.dispatchCommand(CAN_UNDO_COMMAND, history.undoStack.length > 0 || canUndoParent())
        editor.dispatchCommand(CAN_REDO_COMMAND, history.redoStack.length > 0 || canRedoParent())
      }
    }
    // The toolbar can subscribe after the focused cell's effects run.
    const timer = setTimeout(publishAvailability)
    return mergeRegister(
      () => {
        clearTimeout(timer)
      },
      parentEditor.registerUpdateListener(publishAvailability),
      editor.registerCommand(
        CAN_UNDO_COMMAND,
        (available) => {
          if (available || !canUndoParent()) return false
          editor.dispatchCommand(CAN_UNDO_COMMAND, true)
          return true
        },
        COMMAND_PRIORITY_CRITICAL
      ),
      editor.registerCommand(
        CAN_REDO_COMMAND,
        (available) => {
          if (available || !canRedoParent()) return false
          editor.dispatchCommand(CAN_REDO_COMMAND, true)
          return true
        },
        COMMAND_PRIORITY_CRITICAL
      ),
      editor.registerCommand(
        PASTE_COMMAND,
        (event) => {
          if (!editor.isEditable() || !('clipboardData' in event) || !event.clipboardData) return false
          const cells = readTableClipboard(event.clipboardData)
          if (!cells) return false
          if (cells === 'rejected') {
            event.preventDefault()
            return true
          }
          const canPaste = parentEditor.getEditorState().read(() => $getTableNodeByKey(tableKey)?.canPasteCells(colIndex, rowIndex, cells))
          // Consume an oversized region without changing either the cell or
          // the parent table; falling through could insert a nested table.
          event.preventDefault()
          if (!canPaste) return true
          // Commit pending typing before the paste boundary, so one Undo restores
          // what the user saw immediately before pasting.
          save()
          // Cell histories before this table-wide operation are older than the
          // parent paste entry. Reset their boundary even for untouched cells,
          // otherwise Undo in another cell can undo old typing first.
          for (const cellEditor of cellEditors) {
            const localHistory = getPeerDependencyFromEditor<typeof HistoryExtension>(cellEditor, HistoryExtension.name)!.output
              .historyState.value
            localHistory.undoStack = []
            localHistory.redoStack = []
          }
          if (parentHistory && !parentHistory.current) {
            parentHistory.current = { editor: parentEditor, editorState: parentEditor.getEditorState() }
          }
          parentEditor.update(
            () => {
              $getTableNodeByKey(tableKey)?.pasteCells(colIndex, rowIndex, cells)
            },
            { discrete: true, tag: HISTORY_PUSH_TAG }
          )
          pasteHistoryStates.add(parentEditor.getEditorState())
          setActiveCell([colIndex, rowIndex])
          parentEditor.dispatchCommand(NESTED_EDITOR_UPDATED_COMMAND, undefined)
          return true
        },
        COMMAND_PRIORITY_CRITICAL
      ),
      editor.registerCommand(
        UNDO_COMMAND,
        () => {
          if (history.undoStack.length > 0 || !canUndoParent()) return false
          parentEditor.dispatchCommand(UNDO_COMMAND, undefined)
          return true
        },
        COMMAND_PRIORITY_CRITICAL
      ),
      editor.registerCommand(
        REDO_COMMAND,
        () => {
          if (history.redoStack.length > 0 || !canRedoParent()) return false
          parentEditor.dispatchCommand(REDO_COMMAND, undefined)
          return true
        },
        COMMAND_PRIORITY_CRITICAL
      )
    )
  }, [editor, focus, save, parentEditor, tableKey, colIndex, rowIndex, setActiveCell, cellEditors, pasteHistoryStates])

  const isCurrentCell = React.useCallback(
    () =>
      Boolean(editor && cellEditors.has(editor)) &&
      parentEditor.getEditorState().read(() => {
        const cell = $getTableNodeByKey(tableKey)?.getMdastNode().children.at(rowIndex)?.children.at(colIndex)
        return Boolean(
          cell && (cell as { __cacheKey?: string }).__cacheKey === (cellIdentity.current as { __cacheKey?: string }).__cacheKey
        )
      }),
    [editor, cellEditors, parentEditor, tableKey, rowIndex, colIndex]
  )

  const saveAndFocus = React.useCallback(
    (nextCell: [number, number] | null) => {
      if (!isCurrentCell()) return
      save()
      // Leaving the cell commits its edit as a parent-table history step.
      // Keep local typing undo while editing, but do not replay that same edit
      // again from an older local stack after the parent has restored it.
      const parentHistory = getPeerDependencyFromEditor<typeof HistoryExtension>(parentEditor, HistoryExtension.name)?.output.historyState
        .value
      const hasPasteHistory =
        parentHistory &&
        [parentHistory.current, ...parentHistory.undoStack, ...parentHistory.redoStack].some(
          (entry) => entry && pasteHistoryStates.has(entry.editorState)
        )
      if (editor && hasPasteHistory) {
        const history = getPeerDependencyFromEditor<typeof HistoryExtension>(editor, HistoryExtension.name)!.output.historyState.value
        history.undoStack = []
        history.redoStack = []
      }
      setActiveCell(nextCell)
    },
    [editor, isCurrentCell, save, setActiveCell, parentEditor, pasteHistoryStates]
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

      editor.registerCommand(DELETE_CHARACTER_COMMAND, $isCollapsedAtCellEdge, COMMAND_PRIORITY_CRITICAL),
      editor.registerCommand(DELETE_WORD_COMMAND, $isCollapsedAtCellEdge, COMMAND_PRIORITY_CRITICAL),
      editor.registerCommand(DELETE_LINE_COMMAND, $isCollapsedAtCellEdge, COMMAND_PRIORITY_CRITICAL),

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
          // A late update, such as a finished upload, can arrive after the user
          // moved to another cell, which must stay active.
          if (focus) {
            saveAndFocus(null)
          } else {
            save()
          }
          return true
        },
        COMMAND_PRIORITY_EDITOR
      )
    )
  }, [colIndex, editor, focus, rootEditor, rowIndex, save, saveAndFocus, setActiveCell])

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

  const insertColumnAt = React.useCallback(
    (colIndex: number) => {
      let inserted = false
      parentEditor.update(
        () => {
          const currentTable = $getTableNodeByKey(tableKey)
          if (!currentTable) {
            return
          }
          currentTable.insertColumnAt(colIndex)
          inserted = true
        },
        {
          onUpdate: () => {
            if (inserted) {
              setActiveCellWithBoundaries([colIndex, 0])
            }
          }
        }
      )
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
    <RadixPopover.Root>
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
      let inserted = false
      parentEditor.update(
        () => {
          const currentTable = $getTableNodeByKey(tableKey)
          if (!currentTable) {
            return
          }
          currentTable.insertRowAt(rowIndex)
          inserted = true
        },
        {
          onUpdate: () => {
            if (inserted) {
              setActiveCellWithBoundaries([0, rowIndex])
            }
          }
        }
      )
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
