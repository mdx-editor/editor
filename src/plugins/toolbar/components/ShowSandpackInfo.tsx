import { useI18n } from '@/i18n/I18nProvider'
import { useCellValues } from '@mdxeditor/gurx'
import React from 'react'
import styles from '../../../styles/ui.module.css'
import { CodeBlockNode } from '../../codeblock/CodeBlockNode'
import { activeEditor$, editorInFocus$, iconComponentFor$ } from '../../core'
import { sandpackConfig$ } from '../../sandpack'
import { ButtonWithTooltip } from '.././primitives/toolbar'

/**
 * A component that displays the focused live code block's name.
 * For this component to work, you must enable the `sandpackPlugin` for the editor.
 * See {@link ConditionalContents} for an example on how to display the dropdown only when a sandpack editor is in focus.
 * @group Toolbar Components
 */
export const ShowSandpackInfo = () => {
  const i18n = useI18n()
  const [editorInFocus, theEditor, iconComponentFor, sandpackConfig] = useCellValues(
    editorInFocus$,
    activeEditor$,
    iconComponentFor$,
    sandpackConfig$
  )
  const sandpackNode = editorInFocus!.rootNode as CodeBlockNode

  const preset = sandpackConfig.presets.find((preset) => preset.meta === sandpackNode.getMeta())!

  return (
    <div className={styles.selectWithLabel}>
      <ButtonWithTooltip
        title={i18n.sandpack.deleteCodeBlock}
        onClick={() => {
          theEditor?.update(() => {
            if (sandpackNode.getNextSibling()) {
              sandpackNode.selectNext()
            } else {
              sandpackNode.selectPrevious()
            }
            sandpackNode.remove()
          })
        }}
      >
        {iconComponentFor('delete_big')}
      </ButtonWithTooltip>

      <label>Sandpack preset: {preset.name}</label>
    </div>
  )
}
