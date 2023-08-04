import React from 'react'
import { corePluginHooks } from '../../core'
import { Select } from '.././primitives/select'
import { CodeBlockNode } from '../../codeblock/CodeBlockNode'
import { codeMirrorHooks } from '../../codemirror'
import styles from '../../../styles/ui.module.css'

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
        triggerTitle="Select admonition type"
        placeholder="Admonition type"
        items={Object.entries(codeBlockLanguages).map(([value, label]) => ({ value, label }))}
      />
    </div>
  )
}
