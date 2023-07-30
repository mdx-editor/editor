import { realmPlugin, system } from '../../gurx'
import { coreSystem } from '../core/realmPlugin'
import { gfmTableFromMarkdown, gfmTableToMarkdown } from 'mdast-util-gfm-table'
import { gfmTable } from 'micromark-extension-gfm-table'
import { MdastTableVisitor } from './MdastTableVisitor'
import { $createTableNode, TableNode } from './TableNode'
import { LexicalTableVisitor } from './LexicalTableVisitor'
import { $insertNodeToNearestRoot } from '@lexical/utils'
import { $getSelection, $isRangeSelection } from 'lexical'
import * as Mdast from 'mdast'

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
  (r, [{ rootEditor }]) => {
    const insertTable = r.node<true>()

    r.sub(r.pipe(insertTable, r.o.withLatestFrom(rootEditor)), ([, theEditor]) => {
      theEditor?.getEditorState().read(() => {
        const selection = $getSelection()

        if ($isRangeSelection(selection)) {
          const focusNode = selection.focus.getNode()

          if (focusNode !== null) {
            theEditor.update(() => {
              const tableNode = $createTableNode(seedTable())
              $insertNodeToNearestRoot(tableNode)
              setTimeout(() => {
                tableNode.select([0, 0])
              }, 50)
            })
          }
        }
      })
    })

    return {
      insertTable
    }
  },
  [coreSystem]
)

export const [tablePlugin, tablePluginHooks] = realmPlugin({
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
