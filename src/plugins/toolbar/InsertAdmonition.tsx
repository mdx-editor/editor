import React from 'react'
import { ButtonOrDropdownButton } from './primitives/toolbar'
import AdmonitionIcon from '../../icons/emergency_home.svg'
import { directivesPluginHooks } from '../directives'
import { ADMONITION_TYPES } from '../../directive-editors/AdmonitionDirectiveDescriptor'
import { RequirePlugin } from '../../gurx'

const InnerInsertAdmonition = () => {
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

export const InsertAdmonition = () => {
  return (
    <RequirePlugin id="directives">
      <InnerInsertAdmonition />
    </RequirePlugin>
  )
}
