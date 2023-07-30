import React from 'react'
import { ButtonWithTooltip } from './primitives/toolbar'
import FrontmatterIcon from '../../icons/frontmatter.svg'
import { frontmatterPluginHooks } from '../frontmatter/realmPlugin'

export const InsertFrontmatter: React.FC = () => {
  const insertFrontmatter = frontmatterPluginHooks.usePublisher('insertFrontmatter')
  return (
    <ButtonWithTooltip title="Insert frontmatter editor" onClick={insertFrontmatter.bind(null, true)}>
      <FrontmatterIcon />
    </ButtonWithTooltip>
  )
}
