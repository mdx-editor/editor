import React from 'react'
import { ButtonOrDropdownButton } from './primitives/toolbar'
import LiveCodeIcon from '../../icons/deployed_code.svg'
import { sandpackPluginHooks } from '../sandpack/realmPlugin'

export const InsertSandpack = () => {
  const [sandpackConfig] = sandpackPluginHooks.useEmitterValues('sandpackConfig')
  const insertSandpack = sandpackPluginHooks.usePublisher('insertSandpack')
  return (
    <ButtonOrDropdownButton
      title="Insert Sandpack"
      onChoose={(presetName) => {
        insertSandpack(presetName)
      }}
      items={sandpackConfig.presets.map((preset) => ({ value: preset.name, label: preset.name }))}
    >
      <LiveCodeIcon />
    </ButtonOrDropdownButton>
  )
}
