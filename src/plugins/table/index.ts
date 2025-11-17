import { realmPlugin } from '../../RealmWithPlugins'
import { Signal, map } from '@mdxeditor/gurx'
import * as Mdast from 'mdast'
import { gfmTableFromMarkdown, gfmTableToMarkdown, Options as GfmTableOptions } from 'mdast-util-gfm-table'
import { gfmTable } from 'micromark-extension-gfm-table'
import {
  addExportVisitor$,
  addImportVisitor$,
  addLexicalNode$,
  addMdastExtension$,
  addSyntaxExtension$,
  addToMarkdownExtension$,
  insertDecoratorNode$
} from '../core'
import { LexicalTableVisitor } from './LexicalTableVisitor'
import { MdastTableVisitor } from './MdastTableVisitor'
import { $createTableNode, TableNode } from './TableNode'
export * from './TableNode'

function seedTable(rows = 1, columns = 1): Mdast.Table {
  const table: Mdast.Table = {
    type: 'table',
    children: []
  }

  for (let i = 0; i < rows; i++) {
    const tableRow: Mdast.TableRow = {
      type: 'tableRow',
      children: []
    }

    for (let j = 0; j < columns; j++) {
      const cell: Mdast.TableCell = {
        type: 'tableCell',
        children: []
      }
      tableRow.children.push(cell)
    }

    table.children.push(tableRow)
  }

  return table
}

/**
 * A signal that will insert a table with the published amount of rows and columns into the active editor.
 * @example
 * ```tsx
 * const insertTable = usePublisher(insertTable$)
 * // ...
 * insertTable({ rows: 3, columns: 4 })
 * ```
 *
 * @group Table
 */
export const insertTable$ = Signal<{
  /**
   * The number of rows of the table.
   */
  rows?: number
  /**
   * The number of columns of the table.
   */
  columns?: number
}>((r) => {
  r.link(
    r.pipe(
      insertTable$,
      map(({ rows, columns }) => {
        return () => $createTableNode(seedTable(rows, columns))
      })
    ),
    insertDecoratorNode$
  )
})

/**
 * A plugin that adds support for tables to the editor.
 * @group Table
 */
export const tablePlugin = realmPlugin<GfmTableOptions>({
  init(realm, params) {
    realm.pubIn({
      // import
      [addMdastExtension$]: gfmTableFromMarkdown(),
      [addSyntaxExtension$]: gfmTable(),
      [addImportVisitor$]: MdastTableVisitor,
      // export
      [addLexicalNode$]: TableNode,
      [addExportVisitor$]: LexicalTableVisitor,
      [addToMarkdownExtension$]: gfmTableToMarkdown({
        tableCellPadding: params?.tableCellPadding ?? true,
        tablePipeAlign: params?.tablePipeAlign ?? true
      })
    })
  }
})
