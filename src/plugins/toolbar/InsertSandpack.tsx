import React from 'react'
import { ButtonOrDropdownButton } from './primitives/toolbar'
import LiveCodeIcon from '../../icons/deployed_code.svg'
import { sandpackPluginHooks } from '../sandpack/realmPlugin'

export const InsertSandpack = () => {
  const [sandpackConfig] = sandpackPluginHooks.useEmitterValues('sandpackConfig')
  const insertSandpack = sandpackPluginHooks.usePublisher('insertSandpack')
  const items = React.useMemo(() => sandpackConfig.presets.map((preset) => ({ value: preset.name, label: preset.name })), [sandpackConfig])

  return (
    <ButtonOrDropdownButton title="Insert Sandpack" onChoose={insertSandpack} items={items}>
      <LiveCodeIcon />
    </ButtonOrDropdownButton>
  )
}
