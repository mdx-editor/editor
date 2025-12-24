import { $createHeadingNode, HeadingNode } from '@lexical/rich-text'
import { Cell } from '@mdxeditor/gurx'
import { $createParagraphNode, COMMAND_PRIORITY_LOW, KEY_DOWN_COMMAND } from 'lexical'
import { realmPlugin } from '../../RealmWithPlugins'
import { controlOrMeta } from '../../utils/detectMac'
import {
  addActivePlugin$,
  addExportVisitor$,
  addImportVisitor$,
  addLexicalNode$,
  convertSelectionToNode$,
  createRootEditorSubscription$
} from '../core'
import { LexicalHeadingVisitor } from './LexicalHeadingVisitor'
import { MdastHeadingVisitor } from './MdastHeadingVisitor'

const FORMATTING_KEYS = ['Digit0', 'Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6']

/**
 * @group Headings
 */
export const ALL_HEADING_LEVELS = [1, 2, 3, 4, 5, 6] as const

/**
 * @group Headings
 */
export type HEADING_LEVEL = 1 | 2 | 3 | 4 | 5 | 6

const CODE_TO_HEADING_LEVEL_MAP: Record<string, HEADING_LEVEL> = {
  Digit1: 1,
  Digit2: 2,
  Digit3: 3,
  Digit4: 4,
  Digit5: 5,
  Digit6: 6
}

/**
 * Holds the allowed heading levels.
 * @group Headings
 */
export const allowedHeadingLevels$ = Cell<readonly HEADING_LEVEL[]>(ALL_HEADING_LEVELS, (r) => {
  r.pub(createRootEditorSubscription$, (theRootEditor) => {
    return theRootEditor.registerCommand<KeyboardEvent>(
      KEY_DOWN_COMMAND,
      (event) => {
        const { code, ctrlKey, metaKey, altKey } = event
        if (FORMATTING_KEYS.includes(code) && controlOrMeta(metaKey, ctrlKey) && altKey) {
          event.preventDefault()
          theRootEditor.update(() => {
            if (code === 'Digit0') {
              r.pub(convertSelectionToNode$, () => $createParagraphNode())
            } else {
              const allowedHeadingLevels = r.getValue(allowedHeadingLevels$)
              const requestedHeadingLevel = CODE_TO_HEADING_LEVEL_MAP[code]
              if (allowedHeadingLevels.includes(requestedHeadingLevel)) {
                r.pub(convertSelectionToNode$, () => $createHeadingNode(`h${requestedHeadingLevel}`))
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
})

/**
 * A plugin that adds support for markdown headings.
 * @group Headings
 */
export const headingsPlugin = realmPlugin<{
  /**
   * Allows you to limit the headings used in the editor. Affects the block type dropdown and the keyboard shortcuts.
   * @default [1, 2, 3, 4, 5, 6]
   */
  allowedHeadingLevels?: readonly HEADING_LEVEL[]
}>({
  init(realm) {
    realm.pubIn({
      [addActivePlugin$]: 'headings',
      [addImportVisitor$]: MdastHeadingVisitor,
      [addLexicalNode$]: HeadingNode,
      [addExportVisitor$]: LexicalHeadingVisitor
    })
  },
  update(realm, params) {
    realm.pub(allowedHeadingLevels$, params?.allowedHeadingLevels ?? ALL_HEADING_LEVELS)
  }
})
