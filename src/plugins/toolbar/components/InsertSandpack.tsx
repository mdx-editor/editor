import React from 'react'
import { ButtonOrDropdownButton } from '.././primitives/toolbar'
import { sandpackPluginHooks } from '../../sandpack'

/**
 * A dropdown button that allows the user to insert a live code block into the editor. The dropdown offers a list of presets that are defined in the sandpack plugin config.
 * For this to work, you need to have the `sandpackPlugin` installed.
 */
export const InsertSandpack = () => {
  const [sandpackConfig] = sandpackPluginHooks.useEmitterValues('sandpackConfig')
  const insertSandpack = sandpackPluginHooks.usePublisher('insertSandpack')
  const items = React.useMemo(() => sandpackConfig.presets.map((preset) => ({ value: preset.name, label: preset.label })), [sandpackConfig])
  const [iconComponentFor] = sandpackPluginHooks.useEmitterValues('iconComponentFor')

  return (
    <ButtonOrDropdownButton title="Insert Sandpack" onChoose={insertSandpack} items={items}>
      {iconComponentFor('sandpack')}
    </ButtonOrDropdownButton>
  )
}
