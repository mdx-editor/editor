import React from 'react'
import { ButtonOrDropdownButton } from '.././primitives/toolbar'
import { insertDirective$ } from '../../directives'
import { ADMONITION_TYPES } from '../../../directive-editors/AdmonitionDirectiveDescriptor'
import { useCellValue, usePublisher } from '@mdxeditor/gurx'
import { iconComponentFor$, useTranslation } from '../../core'
import { admonitionLabelsMap } from './ChangeAdmonitionType'

/**
 * A toolbar dropdown button that allows the user to insert admonitions.
 * For this to work, you need to have the `directives` plugin enabled with the {@link AdmonitionDirectiveDescriptor} configured.
 *
 * @group Toolbar Components
 */
export const InsertAdmonition = () => {
  const insertDirective = usePublisher(insertDirective$)
  const iconComponentFor = useCellValue(iconComponentFor$)
  const t = useTranslation()

  const items = React.useMemo(() => {
    const labels = admonitionLabelsMap(t)
    return ADMONITION_TYPES.map((type) => ({ value: type, label: labels[type] }))
  }, [t])

  return (
    <ButtonOrDropdownButton
      title={t('toolbar.admonition', 'Insert Admonition')}
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
