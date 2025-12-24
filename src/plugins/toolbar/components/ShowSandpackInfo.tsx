import React from 'react'
import styles from '../../../styles/ui.module.css'
import { $isCodeBlockNode } from '../../codeblock/CodeBlockNode'
import { activeEditor$, editorInFocus$, iconComponentFor$, useTranslation } from '../../core'
import { sandpackConfig$ } from '../../sandpack'
import { ButtonWithTooltip } from '.././primitives/toolbar'
import { useCellValues } from '@mdxeditor/gurx'

/**
 * A component that displays the focused live code block's name.
 * For this component to work, you must enable the `sandpackPlugin` for the editor.
 * See {@link ConditionalContents} for an example on how to display the dropdown only when a sandpack editor is in focus.
 * @group Toolbar Components
 */
export const ShowSandpackInfo = () => {
  const [editorInFocus, theEditor, iconComponentFor, sandpackConfig] = useCellValues(
    editorInFocus$,
    activeEditor$,
    iconComponentFor$,
    sandpackConfig$
  )
  const t = useTranslation()

  const sandpackNode = $isCodeBlockNode(editorInFocus!.rootNode) ? editorInFocus!.rootNode : null
  if (!sandpackNode) {
    return null
  }

  const preset = sandpackConfig.presets.find((preset) => preset.meta === sandpackNode.getMeta())!

  return (
    <div className={styles.selectWithLabel}>
      <ButtonWithTooltip
        title={t('toolbar.deleteSandpack', 'Delete this code block')}
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
