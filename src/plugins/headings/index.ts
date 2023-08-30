import { realmPlugin, system } from '../../gurx'
import { coreSystem } from '../core'
import { MdastHeadingVisitor } from './MdastHeadingVisitor'
import { $createHeadingNode, HeadingNode } from '@lexical/rich-text'
import { LexicalHeadingVisitor } from './LexicalHeadingVisitor'
import { KEY_DOWN_COMMAND, COMMAND_PRIORITY_LOW, $createParagraphNode } from 'lexical'
import { controlOrMeta } from '../../utils/detectMac'

const FORMATTING_KEYS = [48, 49, 50, 51, 52, 53, 54]

const ALL_HEADING_LEVELS = [1, 2, 3, 4, 5, 6] as const
export type HEADING_LEVEL = (typeof ALL_HEADING_LEVELS)[number]

const CODE_TO_HEADING_LEVEL_MAP: Record<string, HEADING_LEVEL> = {
  49: 1,
  50: 2,
  51: 3,
  52: 4,
  53: 5,
  54: 6
}

/**
 * @internal
 */
export const headingsSystem = system(
  (r, [{ createRootEditorSubscription, convertSelectionToNode }]) => {
    const allowedHeadingLevels = r.node<ReadonlyArray<HEADING_LEVEL>>(ALL_HEADING_LEVELS)
    r.pub(createRootEditorSubscription, (theRootEditor) => {
      return theRootEditor.registerCommand<KeyboardEvent>(
        KEY_DOWN_COMMAND,
        (event) => {
          const { keyCode, ctrlKey, metaKey, altKey } = event
          if (FORMATTING_KEYS.includes(keyCode) && controlOrMeta(metaKey, ctrlKey) && altKey) {
            event.preventDefault()
            theRootEditor.update(() => {
              if (keyCode === 48) {
                r.pub(convertSelectionToNode, () => $createParagraphNode())
              } else {
                const allowedHeadingLevelsValues = r.getValue(allowedHeadingLevels)
                const requestedHeadingLevel = CODE_TO_HEADING_LEVEL_MAP[keyCode]
                if (!allowedHeadingLevelsValues.includes(requestedHeadingLevel)) {
                  r.pub(convertSelectionToNode, () => $createHeadingNode(`h${requestedHeadingLevel}`))
                }
              }
            })
            return true
          }

          return false
        },
        COMMAND_PRIORITY_LOW
      )
    })
    return {
      allowedHeadingLevels
    }
  },
  [coreSystem]
)

/**
 * The parameters of the `headingsPlugin`.
 */
interface HeadingsPluginParams {
  /**
   * Allows you to limit the headings used in the editor. Affects the block type dropdown and the keyboard shortcuts.
   * @default [1, 2, 3, 4, 5, 6]
   */
  allowedHeadingLevels?: ReadonlyArray<HEADING_LEVEL>
}
/**
 * @internal
 */
export const [headingsPlugin, headingsPluginHooks] = realmPlugin({
  id: 'headings',
  systemSpec: headingsSystem,
  applyParamsToSystem(realm, params?: HeadingsPluginParams) {
    realm.pubKey('allowedHeadingLevels', params?.allowedHeadingLevels ?? ALL_HEADING_LEVELS)
  },
  init: (realm) => {
    realm.pubKey('addImportVisitor', MdastHeadingVisitor)
    realm.pubKey('addLexicalNode', HeadingNode)
    realm.pubKey('addExportVisitor', LexicalHeadingVisitor)
  }
})
