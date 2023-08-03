import React from 'react'
import { ButtonWithTooltip } from './primitives/toolbar'
import FrameSourceIcon from '../../icons/frame_source.svg'
import { codeBlockPluginHooks } from '../codeblock'
import { RequirePlugin } from '../../gurx'

const InnerInsertCodeBlock: React.FC = () => {
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

export const InsertCodeBlock: React.FC = () => {
  return (
    <RequirePlugin id="codeblock">
      <InnerInsertCodeBlock />
    </RequirePlugin>
  )
}
