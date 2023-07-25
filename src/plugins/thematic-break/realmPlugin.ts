import { realmPlugin, system } from '../../gurx'
import { coreSystem } from '../core/realmPlugin'
import { MdastThematicBreakVisitor } from './MdastThematicBreakVisitor'
import { LexicalThematicBreakVisitor } from './LexicalThematicBreakVisitor'
import { HorizontalRuleNode } from '@lexical/react/LexicalHorizontalRuleNode'

export const thematicBreakSystem = system((_) => ({}), [coreSystem])

export const [thematicBreakPlugin] = realmPlugin({
  systemSpec: thematicBreakSystem,

  init: (realm) => {
    realm.pubKey('addImportVisitor', MdastThematicBreakVisitor)
    realm.pubKey('addLexicalNode', HorizontalRuleNode)
    realm.pubKey('addExportVisitor', LexicalThematicBreakVisitor)
  }
})
