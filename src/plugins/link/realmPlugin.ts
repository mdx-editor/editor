import { realmPlugin, system } from '../../gurx'
import { coreSystem } from '../core/realmPlugin'
import { MdastLinkVisitor } from './MdastLinkVisitor'
import { LexicalLinkVisitor } from './LexicalLinkVisitor'
import { LinkNode } from '@lexical/link'

export const linkSystem = system((_) => ({}), [coreSystem])

export const [linkPlugin] = realmPlugin({
  systemSpec: linkSystem,

  init: (realm) => {
    realm.pubKey('addImportVisitor', MdastLinkVisitor)
    realm.pubKey('addLexicalNode', LinkNode)
    realm.pubKey('addExportVisitor', LexicalLinkVisitor)
  }
})
