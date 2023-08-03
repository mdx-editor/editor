import { realmPlugin, system } from '../../gurx'
import { coreSystem } from '../core'
import { MdastHeadingVisitor } from './MdastHeadingVisitor'
import { HeadingNode } from '@lexical/rich-text'
import { LexicalHeadingVisitor } from './LexicalHeadingVisitor'

export const headingsSystem = system((_) => ({}), [coreSystem])

export const [headingsPlugin] = realmPlugin({
  id: 'headings',
  systemSpec: headingsSystem,

  init: (realm) => {
    realm.pubKey('addImportVisitor', MdastHeadingVisitor)
    realm.pubKey('addLexicalNode', HeadingNode)
    realm.pubKey('addExportVisitor', LexicalHeadingVisitor)
  }
})
