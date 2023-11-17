import React from 'react'
import { ButtonWithTooltip } from '.././primitives/toolbar'
import { codeBlockPluginHooks } from '../../codeblock/'

/**
 * A toolbar button that allows the user to insert a fenced code block.
 * Once the code block is focused, you can construct a special code block toolbar for it, using the {@link ConditionalContents} primitive.
 * See the {@link ConditionalContents} documentation for an example.
 */
export const InsertCodeBlock: React.FC = () => {
  const insertCodeBlock = codeBlockPluginHooks.usePublisher('insertCodeBlock')
  const [iconComponentFor] = codeBlockPluginHooks.useEmitterValues('iconComponentFor')
  return (
    <ButtonWithTooltip
      title="Insert code block"
      onClick={() => {
        insertCodeBlock({})
      }}
    >
      {iconComponentFor('frame_source')}
    </ButtonWithTooltip>
  )
}
