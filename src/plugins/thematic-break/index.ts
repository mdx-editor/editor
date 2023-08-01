import { realmPlugin, system } from '../../gurx'
import { coreSystem } from '../core'
import { MdastThematicBreakVisitor } from './MdastThematicBreakVisitor'
import { LexicalThematicBreakVisitor } from './LexicalThematicBreakVisitor'
import { HorizontalRuleNode, INSERT_HORIZONTAL_RULE_COMMAND } from '@lexical/react/LexicalHorizontalRuleNode'
import { HorizontalRulePlugin } from '@lexical/react/LexicalHorizontalRulePlugin'

export const thematicBreakSystem = system(
  (r, [{ activeEditor }]) => {
    const insertThematicBreak = r.node<true>()

    r.sub(r.pipe(insertThematicBreak, r.o.withLatestFrom(activeEditor)), ([, theEditor]) => {
      theEditor?.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined)
    })

    return {
      insertThematicBreak
    }
  },
  [coreSystem]
)

export const [thematicBreakPlugin, thematicBreakPluginHooks] = realmPlugin({
  systemSpec: thematicBreakSystem,

  init: (realm) => {
    realm.pubKey('addImportVisitor', MdastThematicBreakVisitor)
    realm.pubKey('addLexicalNode', HorizontalRuleNode)
    realm.pubKey('addExportVisitor', LexicalThematicBreakVisitor)
    realm.pubKey('addComposerChild', HorizontalRulePlugin)
  }
})
