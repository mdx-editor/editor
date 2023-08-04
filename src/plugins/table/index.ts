import * as Mdast from 'mdast'
import { gfmTableFromMarkdown, gfmTableToMarkdown } from 'mdast-util-gfm-table'
import { gfmTable } from 'micromark-extension-gfm-table'
import { realmPlugin, system } from '../../gurx'
import { coreSystem } from '../core'
import { LexicalTableVisitor } from './LexicalTableVisitor'
import { MdastTableVisitor } from './MdastTableVisitor'
import { $createTableNode, TableNode } from './TableNode'

function seedTable(): Mdast.Table {
  return {
    type: 'table',
    children: [
      {
        type: 'tableRow',
        children: [{ type: 'tableCell', children: [] }]
      }
    ]
  }
}

export const tableSystem = system(
  (r, [{ insertDecoratorNode }]) => {
    const insertTable = r.node<true>()

    r.link(
      r.pipe(
        insertTable,
        r.o.mapTo(() => {
          return $createTableNode(seedTable())
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

export const [tablePlugin, tablePluginHooks] = realmPlugin({
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
