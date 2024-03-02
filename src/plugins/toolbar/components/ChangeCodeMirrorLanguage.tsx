import { useI18n } from '@/plugins/core/i18n'
import { useCellValues } from '@mdxeditor/gurx'
import React from 'react'
import styles from '../../../styles/ui.module.css'
import { CodeBlockNode } from '../../codeblock/CodeBlockNode'
import { codeBlockLanguages$ } from '../../codemirror'
import { activeEditor$, editorInFocus$ } from '../../core'
import { Select } from '.././primitives/select'

const EMPTY_VALUE = '__EMPTY_VALUE__'
/**
 * A component that allows the user to change the code block language of the current selection.
 * For this component to work, you must enable the `codeMirrorPlugin` for the editor.
 * See {@link ConditionalContents} for an example on how to display the dropdown only when a code block is in focus.
 * @group Toolbar Components
 */
export const ChangeCodeMirrorLanguage = () => {
  const i18n = useI18n()
  const [editorInFocus, theEditor, codeBlockLanguages] = useCellValues(editorInFocus$, activeEditor$, codeBlockLanguages$)
  const codeBlockNode = editorInFocus!.rootNode as CodeBlockNode

  let currentLanguage = codeBlockNode.getLanguage()
  if (currentLanguage === '') {
    currentLanguage = EMPTY_VALUE
  }
  return (
    <div className={styles.selectWithLabel}>
      <label>{i18n.codeBlock.language}</label>
      <Select
        value={currentLanguage}
        onChange={(language) => {
          theEditor?.update(() => {
            codeBlockNode.setLanguage(language === EMPTY_VALUE ? '' : language)
            setTimeout(() => {
              theEditor?.update(() => {
                codeBlockNode.getLatest().select()
              })
            })
          })
        }}
        triggerTitle={i18n.codeBlock.selectLanguage}
        placeholder={i18n.codeBlock.language}
        items={Object.entries(codeBlockLanguages).map(([value, label]) => ({ value: value ? value : EMPTY_VALUE, label }))}
      />
    </div>
  )
}
