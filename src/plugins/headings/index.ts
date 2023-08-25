import { realmPlugin, system } from '../../gurx'
import { coreSystem } from '../core'
import { MdastHeadingVisitor } from './MdastHeadingVisitor'
import { $createHeadingNode, HeadingNode, HeadingTagType } from '@lexical/rich-text'
import { LexicalHeadingVisitor } from './LexicalHeadingVisitor'
import { KEY_DOWN_COMMAND, COMMAND_PRIORITY_LOW, $createParagraphNode } from 'lexical'
import { controlOrMeta } from '../../utils/detectMac'

const FORMATTING_KEYS = [48, 49, 50, 51, 52, 53, 54]

const CODE_TO_HEADING_MAP: Record<string, HeadingTagType> = {
  49: 'h1',
  50: 'h2',
  51: 'h3',
  52: 'h4',
  53: 'h5',
  54: 'h6'
}
/**
 * @internal
 */
export const headingsSystem = system(
  (r, [{ createRootEditorSubscription, convertSelectionToNode }]) => {
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
                r.pub(convertSelectionToNode, () => $createHeadingNode(CODE_TO_HEADING_MAP[keyCode]))
              }
            })
            return true
          }

          return false
        },
        COMMAND_PRIORITY_LOW
      )
    })
    return {}
  },
  [coreSystem]
)

/**
 * @internal
 */
export const [headingsPlugin] = realmPlugin({
  id: 'headings',
  systemSpec: headingsSystem,

  init: (realm) => {
    realm.pubKey('addImportVisitor', MdastHeadingVisitor)
    realm.pubKey('addLexicalNode', HeadingNode)
    realm.pubKey('addExportVisitor', LexicalHeadingVisitor)
  }
})
