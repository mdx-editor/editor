import { realmPlugin, system } from '../../gurx'
import { coreSystem } from '../core/realmPlugin'
import { gfmTableFromMarkdown, gfmTableToMarkdown } from 'mdast-util-gfm-table'
import { gfmTable } from 'micromark-extension-gfm-table'
import { MdastTableVisitor } from './MdastTableVisitor'
import { TableNode } from './TableNode'
import { LexicalTableVisitor } from './LexicalTableVisitor'

export const tableSystem = system((_) => ({}), [coreSystem])

export const [tablePlugin] = realmPlugin({
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
