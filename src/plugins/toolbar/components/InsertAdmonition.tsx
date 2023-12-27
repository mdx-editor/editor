import React from 'react'
import { ButtonOrDropdownButton } from '.././primitives/toolbar'
import { insertDirective$ } from '../../directives'
import { ADMONITION_TYPES } from '../../../directive-editors/AdmonitionDirectiveDescriptor'
import { useCellValue, usePublisher } from '@mdxeditor/gurx'
import { iconComponentFor$ } from '../../core'

/**
 * A toolbar dropdown button that allows the user to insert admonitions.
 * For this to work, you need to have the `directives` plugin enabled with the {@link AdmonitionDirectiveDescriptor} configured.
 *
 * @group Toolbar Components
 */
export const InsertAdmonition = () => {
  const insertDirective = usePublisher(insertDirective$)
  const iconComponentFor = useCellValue(iconComponentFor$)
  const items = React.useMemo(
    () => ADMONITION_TYPES.map((type) => ({ value: type, label: type.replace(/^./, (l) => l.toUpperCase()) })),
    []
  )

  return (
    <ButtonOrDropdownButton
      title="Insert admonition"
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
