import { useCellValues } from '@mdxeditor/gurx'
import React from 'react'
import styles from '../../../styles/ui.module.css'
import { CodeBlockNode } from '../../codeblock/CodeBlockNode'
import { activeEditor$, editorInFocus$, useTranslation } from '../../core'
import { Select } from '.././primitives/select'
import { codeBlockLanguages$ } from '@/plugins/codemirror/utils'

const EMPTY_VALUE = '__EMPTY_VALUE__'
/**
 * A component that allows the user to change the code block language of the current selection.
 * For this component to work, you must enable the `codeMirrorPlugin` for the editor.
 * See {@link ConditionalContents} for an example on how to display the dropdown only when a code block is in focus.
 * @group Toolbar Components
 */
export const ChangeCodeMirrorLanguage = () => {
  const [editorInFocus, theEditor, codeBlockLanguages] = useCellValues(editorInFocus$, activeEditor$, codeBlockLanguages$)
  const codeBlockNode = editorInFocus!.rootNode as CodeBlockNode
  const t = useTranslation()

  let currentLanguage = codeBlockNode.getLanguage()
  if (currentLanguage === '') {
    currentLanguage = EMPTY_VALUE
  }
  return (
    <div className={styles.selectWithLabel}>
      <label>{t('codeBlock.language', 'Code block language')}</label>
      <Select
        value={currentLanguage}
        onChange={(language) => {
          theEditor?.update(() => {
            codeBlockNode.setLanguage(language === EMPTY_VALUE ? '' : language)
            setTimeout(() => {
              theEditor.update(() => {
                codeBlockNode.getLatest().select()
              })
            })
          })
        }}
        triggerTitle={t('codeBlock.selectLanguage', 'Select code block language')}
        placeholder={t('codeBlock.language', 'Code block language')}
        items={Object.entries(codeBlockLanguages).map(([value, label]) => ({ value: value ? value : EMPTY_VALUE, label }))}
      />
    </div>
  )
}
