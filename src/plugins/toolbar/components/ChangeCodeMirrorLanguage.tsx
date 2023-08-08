import React from 'react'
import { corePluginHooks } from '../../core'
import { Select } from '.././primitives/select'
import { CodeBlockNode } from '../../codeblock/CodeBlockNode'
import { codeMirrorHooks } from '../../codemirror'
import styles from '../../../styles/ui.module.css'

/**
 * A component that allows the user to change the code block language of the current selection.
 * For this component to work, you must enable the `codeMirrorPlugin` for the editor.
 * See {@link ConditionalContents} for an example on how to display the dropdown only when a code block is in focus.
 */
export const ChangeCodeMirrorLanguage = () => {
  const [editorInFocus, theEditor] = corePluginHooks.useEmitterValues('editorInFocus', 'activeEditor')
  const codeBlockNode = editorInFocus!.rootNode as CodeBlockNode
  const [codeBlockLanguages] = codeMirrorHooks.useEmitterValues('codeBlockLanguages')

  return (
    <div className={styles.selectWithLabel}>
      <label>Code block language:</label>
      <Select
        value={codeBlockNode.getLanguage()}
        onChange={(language) => {
          theEditor?.update(() => {
            codeBlockNode.setLanguage(language)
            setTimeout(() => {
              theEditor?.update(() => {
                codeBlockNode.getLatest().select()
              })
            })
          })
        }}
        triggerTitle="Select code block language"
        placeholder="Code block language"
        items={Object.entries(codeBlockLanguages).map(([value, label]) => ({ value, label }))}
      />
    </div>
  )
}
