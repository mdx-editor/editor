import React from 'react'
import { ButtonOrDropdownButton } from '.././primitives/toolbar'
import { insertSandpack$, sandpackConfig$ } from '../../sandpack'
import { useCellValues, usePublisher } from '@mdxeditor/gurx'
import { iconComponentFor$ } from '../../core'
import { useI18n } from '@/plugins/core/i18n'

/**
 * A dropdown button that allows the user to insert a live code block into the editor. The dropdown offers a list of presets that are defined in the sandpack plugin config.
 * For this to work, you need to have the `sandpackPlugin` installed.
 * @group Toolbar Components
 */
export const InsertSandpack = () => {
  const i18n = useI18n()
  const [sandpackConfig, iconComponentFor] = useCellValues(sandpackConfig$, iconComponentFor$)
  const insertSandpack = usePublisher(insertSandpack$)
  const items = React.useMemo(() => sandpackConfig.presets.map((preset) => ({ value: preset.name, label: preset.label })), [sandpackConfig])

  return (
    <ButtonOrDropdownButton title={i18n.toolbar.sandpack} onChoose={insertSandpack} items={items}>
      {iconComponentFor('sandpack')}
    </ButtonOrDropdownButton>
  )
}
