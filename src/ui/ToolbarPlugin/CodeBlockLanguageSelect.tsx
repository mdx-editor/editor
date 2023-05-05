import React from 'react'
import * as Select from '@radix-ui/react-select'
// import { useEmitterValues, usePublisher } from '../../../system'
import { SelectItem, SelectTrigger, SelectContent } from './SelectPieces'
import { useEmitterValues } from '..'
import { $getNodeByKey } from 'lexical'
import { CodeBlockEditorType } from '../../types/ActiveEditorType'
import { CodeBlockNode } from '../../nodes/CodeBlock'

export function CodeBlockLanguageSelect() {
  const [activeEditorType, activeEditor] = useEmitterValues('activeEditorType', 'activeEditor')

  console.log(activeEditorType)
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
      <SelectTrigger placeholder="Language" />
      <SelectContent>
        <SelectItem value="js">JavaScript</SelectItem>
        <SelectItem value="ts">TypeScript</SelectItem>
        <SelectItem value="css">CSS</SelectItem>
      </SelectContent>
    </Select.Root>
  )
}
