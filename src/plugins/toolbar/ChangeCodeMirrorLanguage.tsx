import React from 'react'
import { corePluginHooks } from '../core'
import { Select } from './primitives/select'
import { CodeBlockNode } from '../codeblock/CodeBlockNode'
import { codeMirrorHooks } from '../codemirror'

export const ChangeCodeMirrorLanguage = () => {
  const [editorInFocus, theEditor] = corePluginHooks.useEmitterValues('editorInFocus', 'activeEditor')
  const codeBlockNode = editorInFocus!.rootNode as CodeBlockNode
  const [codeBlockLanguages] = codeMirrorHooks.useEmitterValues('codeBlockLanguages')

  return (
    <Select
      value={codeBlockNode.getLanguage()}
      onChange={(language) => {
        theEditor?.update(() => {
          codeBlockNode.setLanguage(language)
          setTimeout(() => {
            theEditor?.update(() => {
              codeBlockNode.getLatest().select()
            })
          }, 80)
        })
      }}
      triggerTitle="Select admonition type"
      placeholder="Admonition type"
      items={Object.entries(codeBlockLanguages).map(([value, label]) => ({ value, label }))}
    />
  )
}
