/// <reference types="vite-plugin-svgr/client" />
import * as RadixToolbar from '@radix-ui/react-toolbar'
import { $getNodeByKey } from 'lexical'
import React from 'react'
import { CodeBlockNode, SandpackNode } from '../../nodes'
import { useEmitterValues } from '../../system/EditorSystemComponent'
import { CodeBlockEditorType, SandpackEditorType } from '../../types/ActiveEditorType'
import styles from '../styles.module.css'
import { CodeBlockLanguageSelect } from './CodeBlockLanguageSelect'
import DeleteIcon from '../icons/delete.svg'
import { ToolbarButton, ToolbarSeparator, ViewModeSwitch } from './toolbarComponents'

export const ToolbarPlugin = () => {
  const [activeEditorType, viewMode] = useEmitterValues('activeEditorType', 'viewMode')

  return (
    <RadixToolbar.Root className={styles.toolbarRoot} aria-label="Formatting options">
      {viewMode === 'editor' &&
        (activeEditorType.type === 'lexical' ? (
          <RichTextButtonSet />
        ) : activeEditorType.type === 'codeblock' ? (
          <CodeBlockButtonSet />
        ) : (
          <SandpackButtonSet />
        ))}

      <ToolbarSeparator />
      <ViewModeSwitch />
    </RadixToolbar.Root>
  )
}

const CodeBlockButtonSet: React.FC = () => {
  const [activeEditor, activeEditorType] = useEmitterValues('activeEditor', 'activeEditorType')
  return (
    <>
      <CodeBlockLanguageSelect />

      <ToolbarButton
        onClick={() => {
          activeEditor!.update(() => {
            const node = $getNodeByKey((activeEditorType as CodeBlockEditorType).nodeKey) as CodeBlockNode
            node.selectNext()
            node.remove()
          })
        }}
      >
        <DeleteIcon />
      </ToolbarButton>
    </>
  )
}

const SandpackButtonSet: React.FC = () => {
  const [activeEditor, activeEditorType] = useEmitterValues('activeEditor', 'activeEditorType')
  return (
    <>
      <ToolbarButton
        onClick={() => {
          activeEditor!.update(() => {
            const node = $getNodeByKey((activeEditorType as SandpackEditorType).nodeKey) as SandpackNode
            node.selectNext()
            node.remove()
          })
        }}
      >
        <DeleteIcon />
      </ToolbarButton>
    </>
  )
}

const RichTextButtonSet: React.FC = () => {
  const [toolbarComponents] = useEmitterValues('toolbarComponents')
  return (
    <>
      {toolbarComponents.map((Component, index) => (
        <Component key={index} />
      ))}
    </>
  )
}
