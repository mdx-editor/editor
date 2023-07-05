import React from 'react'
import * as Select from '@radix-ui/react-select'
import { SelectItem, SelectTrigger, SelectContent } from './SelectPieces'
import { useEmitterValues } from '../../system/EditorSystemComponent'
import { $getNodeByKey } from 'lexical'
import { CodeBlockEditorType } from '../../types/ActiveEditorType'
import { CodeBlockNode } from '../../nodes'
import styles from '../styles.module.css'

export function CodeBlockLanguageSelect() {
  const [activeEditorType, activeEditor, codeBlockLanguages] = useEmitterValues('activeEditorType', 'activeEditor', 'codeBlockLanguages')

  const nodeLanguage = React.useMemo(() => {
    let language!: string
    activeEditor!.getEditorState().read(() => {
      const node = $getNodeByKey((activeEditorType as CodeBlockEditorType).nodeKey) as CodeBlockNode
      language = node.getLanguage()
    })
    return language
  }, [activeEditor, activeEditorType])

  return (
    <Select.Root
      value={nodeLanguage}
      onValueChange={(language) => {
        activeEditor!.update(() => {
          const node = $getNodeByKey((activeEditorType as CodeBlockEditorType).nodeKey) as CodeBlockNode
          node.setLanguage(language)
          setTimeout(() => {
            node.select()
          }, 80)
        })
      }}
    >
      <SelectTrigger title="Change code block language" placeholder="Language" className={styles.toolbarCodeBlockLanguageSelectTrigger} />
      <SelectContent className={styles.toolbarCodeBlockLanguageSelectContent}>
        {Object.entries(codeBlockLanguages).map(([value, label]) => (
          <SelectItem key={value} value={value}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select.Root>
  )
}
