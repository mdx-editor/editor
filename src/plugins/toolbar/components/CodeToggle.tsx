import React from 'react'
import { IS_CODE } from '../../../FormatConstants'
import { corePluginHooks } from '../../core'
import { MultipleChoiceToggleGroup } from '.././primitives/toolbar'

/**
 * A toolbar component that lets the user toggle code formatting.
 * Use for inline `code` elements (like variables, methods, etc).
 */
export const CodeToggle: React.FC = () => {
  const [currentFormat, iconComponentFor] = corePluginHooks.useEmitterValues('currentFormat', 'iconComponentFor')
  const applyFormat = corePluginHooks.usePublisher('applyFormat')

  const codeIsOn = (currentFormat & IS_CODE) !== 0

  const title = codeIsOn ? 'Remove code format' : 'Inline code format'

  return (
    <MultipleChoiceToggleGroup
      items={[{ title: title, contents: iconComponentFor('code'), active: codeIsOn, onChange: applyFormat.bind(null, 'code') }]}
    />
  )
}
