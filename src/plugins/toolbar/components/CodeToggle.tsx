import React from 'react'
import { IS_CODE } from '../../../FormatConstants'
import CodeIcon from '../../../icons/code.svg'
import { corePluginHooks } from '../../core'
import { MultipleChoiceToggleGroup } from '.././primitives/toolbar'

/**
 * A toolbar component that lets the user toggle code formatting.
 * Use for inline `code` elements (like variables, methods, etc).
 */
export const CodeToggle: React.FC = () => {
  const [currentFormat] = corePluginHooks.useEmitterValues('currentFormat')
  const applyFormat = corePluginHooks.usePublisher('applyFormat')

  const codeIsOn = (currentFormat & IS_CODE) !== 0

  const title = codeIsOn ? 'Remove code format' : 'Inline code format'

  return (
    <MultipleChoiceToggleGroup
      items={[{ title: title, contents: <CodeIcon />, active: codeIsOn, onChange: applyFormat.bind(null, 'code') }]}
    />
  )
}
