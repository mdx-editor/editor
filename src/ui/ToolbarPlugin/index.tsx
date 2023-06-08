/// <reference types="vite-plugin-svgr/client" />
import * as RadixToolbar from '@radix-ui/react-toolbar'
import React from 'react'
import { CodeBlockLanguageSelect } from './CodeBlockLanguageSelect'
import { ReactComponent as DeleteIcon } from './icons/delete.svg'

import { $getNodeByKey } from 'lexical'
import { SandpackNode } from '../../nodes'
import { CodeBlockNode } from '../../nodes/CodeBlock'
import { useEmitterValues, usePublisher } from '../../system'
import { CodeBlockEditorType, SandpackEditorType } from '../../types/ActiveEditorType'
import { ViewMode } from '../SourcePlugin'
import styles from '../styles.module.css'
import { ToggleItem, ToggleSingleGroup, ToolbarButton, ToolbarSeparator } from './toolbarComponents'

export const ToolbarPlugin = () => {
  const [activeEditorType] = useEmitterValues('activeEditorType')

  return (
    <RadixToolbar.Root className={styles.toolbarRoot} aria-label="Formatting options">
      {activeEditorType.type === 'lexical' ? (
        <RichTextButtonSet />
      ) : activeEditorType.type === 'codeblock' ? (
        <CodeBlockButtonSet />
      ) : (
        <SandpackButtonSet />
      )}

      <ToolbarSeparator />
      <ViewModeSwitch />
    </RadixToolbar.Root>
  )
}

const ViewModeSwitch: React.FC = () => {
  const [viewMode] = useEmitterValues('viewMode', 'activeEditorType')
  const setViewMode = usePublisher('viewMode')
  return (
    <ToggleSingleGroup
      aria-label="View Mode"
      onValueChange={(v) => {
        if (v !== '') {
          setViewMode(v as ViewMode)
        }
      }}
      value={viewMode}
      className={styles.toolbarModeSwitch}
    >
      <ToggleItem value="editor" aria-label="Rich text">
        Rich Text
      </ToggleItem>

      <ToggleItem value="diff" aria-label="View diff">
        Diff View
      </ToggleItem>

      <ToggleItem value="markdown" aria-label="View Markdown">
        Markdown
      </ToggleItem>
    </ToggleSingleGroup>
  )
}

const CodeBlockButtonSet: React.FC = () => {
  const [activeEditor, activeEditorType] = useEmitterValues('activeEditor', 'activeEditorType')
  return (
    <>
      <CodeBlockLanguageSelect />

      <ToolbarButton>
        <DeleteIcon
          onClick={() => {
            activeEditor!.update(() => {
              const node = $getNodeByKey((activeEditorType as CodeBlockEditorType).nodeKey) as CodeBlockNode
              node.selectNext()
              node.remove()
            })
          }}
        />
      </ToolbarButton>
    </>
  )
}

const SandpackButtonSet: React.FC = () => {
  const [activeEditor, activeEditorType] = useEmitterValues('activeEditor', 'activeEditorType')
  return (
    <>
      <ToolbarButton>
        <DeleteIcon
          onClick={() => {
            activeEditor!.update(() => {
              const node = $getNodeByKey((activeEditorType as SandpackEditorType).nodeKey) as SandpackNode
              node.selectNext()
              node.remove()
            })
          }}
        />
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
