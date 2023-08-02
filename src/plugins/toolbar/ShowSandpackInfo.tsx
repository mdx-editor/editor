import React from 'react'
import { corePluginHooks } from '../core'
import { CodeBlockNode } from '../codeblock/CodeBlockNode'
import styles from '../../styles/ui.module.css'
import { sandpackPluginHooks } from '../sandpack'
import { ButtonWithTooltip } from './primitives/toolbar'
import DeleteIcon from '../../icons/delete.svg'

export const ShowSandpackInfo = () => {
  const [editorInFocus, theEditor] = corePluginHooks.useEmitterValues('editorInFocus', 'activeEditor')
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
        <DeleteIcon />
      </ButtonWithTooltip>

      <label>Sandpack preset: {preset.name}</label>
    </div>
  )
}
