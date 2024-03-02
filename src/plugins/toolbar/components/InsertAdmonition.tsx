import { useI18n } from '@/plugins/core/i18n'
import { useCellValue, usePublisher } from '@mdxeditor/gurx'
import React from 'react'
import { ADMONITION_TYPES } from '../../../directive-editors/AdmonitionDirectiveDescriptor'
import { iconComponentFor$ } from '../../core'
import { insertDirective$ } from '../../directives'
import { ButtonOrDropdownButton } from '.././primitives/toolbar'

/**
 * A toolbar dropdown button that allows the user to insert admonitions.
 * For this to work, you need to have the `directives` plugin enabled with the {@link AdmonitionDirectiveDescriptor} configured.
 *
 * @group Toolbar Components
 */
export const InsertAdmonition = () => {
  const i18n = useI18n()

  const ADMONITION_LABELS_MAP: Record<(typeof ADMONITION_TYPES)[number], string> = {
    note: i18n.admonitions.note,
    tip: i18n.admonitions.tip,
    danger: i18n.admonitions.danger,
    info: i18n.admonitions.info,
    caution: i18n.admonitions.caution
  } as const

  const insertDirective = usePublisher(insertDirective$)
  const iconComponentFor = useCellValue(iconComponentFor$)

  const items = React.useMemo(() => ADMONITION_TYPES.map((type) => ({ label: ADMONITION_LABELS_MAP[type], value: type })), [])

  return (
    <ButtonOrDropdownButton
      title={i18n.toolbar.admonition}
      onChoose={(admonitionName) => {
        insertDirective({
          type: 'containerDirective',
          name: admonitionName
        })
      }}
      items={items}
    >
      {iconComponentFor('admonition')}
    </ButtonOrDropdownButton>
  )
}
