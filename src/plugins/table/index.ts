import * as Mdast from 'mdast'
import { gfmTableFromMarkdown, gfmTableToMarkdown } from 'mdast-util-gfm-table'
import { gfmTable } from 'micromark-extension-gfm-table'
import { realmPlugin, system } from '../../gurx'
import { coreSystem } from '../core'
import { LexicalTableVisitor } from './LexicalTableVisitor'
import { MdastTableVisitor } from './MdastTableVisitor'
import { $createTableNode, TableNode } from './TableNode'

type InsertTablePayload = {
  /**
   * The nunber of rows of the table.
   */
  rows?: number
  /**
   * The nunber of columns of the table.
   */
  columns?: number
}

function seedTable(rows: number = 1, columns : number = 1): Mdast.Table {
  const table: Mdast.Table = {
    type: 'table',
    children: []
  };

  for (let i = 0; i < rows; i++) {
    const tableRow: Mdast.TableRow = {
      type: 'tableRow',
      children: []
    };

    for (let j = 0; j < columns; j++) {
      const cell: Mdast.TableCell = {
        type: 'tableCell',
        children: []
      };
      tableRow.children.push(cell);
    }

    table.children.push(tableRow);
  }

  return table;
}

/** @internal */
export const tableSystem = system(
  (r, [{ insertDecoratorNode }]) => {
    const insertTable = r.node<InsertTablePayload>()

    r.link(
      r.pipe(
        insertTable,
        r.o.map(({rows, columns}) => {
          return () => $createTableNode(seedTable(rows, columns))
        })
      ),
      insertDecoratorNode
    )

    return {
      insertTable
    }
  },
  [coreSystem]
)

export const [
  /** @internal */
  tablePlugin,
  /** @internal */
  tablePluginHooks
] = realmPlugin({
  id: 'table',
  systemSpec: tableSystem,

  init: (realm) => {
    // import
    realm.pubKey('addMdastExtension', gfmTableFromMarkdown)
    realm.pubKey('addSyntaxExtension', gfmTable)
    realm.pubKey('addImportVisitor', MdastTableVisitor)

    // export
    realm.pubKey('addLexicalNode', TableNode)
    realm.pubKey('addExportVisitor', LexicalTableVisitor)
    realm.pubKey('addToMarkdownExtension', gfmTableToMarkdown({ tableCellPadding: true, tablePipeAlign: true }))
  }
})
