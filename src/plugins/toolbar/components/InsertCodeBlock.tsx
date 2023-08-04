import React from 'react'
import { ButtonWithTooltip } from '.././primitives/toolbar'
import FrameSourceIcon from '../../../icons/frame_source.svg'
import { codeBlockPluginHooks } from '../../codeblock/'

export const InsertCodeBlock: React.FC = () => {
  const insertCodeBlock = codeBlockPluginHooks.usePublisher('insertCodeBlock')
  return (
    <ButtonWithTooltip
      title="Insert code block"
      onClick={() => {
        insertCodeBlock({})
      }}
    >
      <FrameSourceIcon />
    </ButtonWithTooltip>
  )
}
