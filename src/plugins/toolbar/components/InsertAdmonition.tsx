import React from 'react'
import { ButtonOrDropdownButton } from '.././primitives/toolbar'
import AdmonitionIcon from '../../../icons/emergency_home.svg'
import { directivesPluginHooks } from '../../directives'
import { ADMONITION_TYPES } from '../../../directive-editors/AdmonitionDirectiveDescriptor'

/**
 * A toolbar dropdown button that allows the user to insert admonitions.
 * For this to work, you need to have the `directives` plugin enabled with the {@link AdmonitionDirectiveDescriptor} configured.
 */
export const InsertAdmonition = () => {
  const insertDirective = directivesPluginHooks.usePublisher('insertDirective')
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
      <AdmonitionIcon />
    </ButtonOrDropdownButton>
  )
}
