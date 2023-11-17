import React from 'react'
import styles from '../../../styles/ui.module.css'
import { CodeBlockNode } from '../../codeblock/CodeBlockNode'
import { corePluginHooks } from '../../core'
import { sandpackPluginHooks } from '../../sandpack'
import { ButtonWithTooltip } from '.././primitives/toolbar'

/**
 * A component that displays the focused live code block's name.
 * For this component to work, you must enable the `sandpackPlugin` for the editor.
 * See {@link ConditionalContents} for an example on how to display the dropdown only when a sandpack editor is in focus.
 */
export const ShowSandpackInfo = () => {
  const [editorInFocus, theEditor, iconComponentFor] = corePluginHooks.useEmitterValues('editorInFocus', 'activeEditor', 'iconComponentFor')
  const sandpackNode = editorInFocus!.rootNode as CodeBlockNode
  const [sandpackConfig] = sandpackPluginHooks.useEmitterValues('sandpackConfig')

  const preset = sandpackConfig.presets.find((preset) => preset.meta === sandpackNode.getMeta())!

  return (
    <div className={styles.selectWithLabel}>
      <ButtonWithTooltip
        title="Delete this code block"
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
