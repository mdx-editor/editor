import React from 'react'
import { ButtonWithTooltip } from './primitives/toolbar'
import FrontmatterIcon from '../../icons/frontmatter.svg'
import { frontmatterPluginHooks } from '../frontmatter'
import { RequirePlugin } from '../../gurx'

const InnerInsertFrontmatter: React.FC = () => {
  const insertFrontmatter = frontmatterPluginHooks.usePublisher('insertFrontmatter')
  return (
    <ButtonWithTooltip title="Insert frontmatter editor" onClick={insertFrontmatter.bind(null, true)}>
      <FrontmatterIcon />
    </ButtonWithTooltip>
  )
}

export const InsertFrontmatter = () => {
  return (
    <RequirePlugin id="frontmatter">
      <InnerInsertFrontmatter />
    </RequirePlugin>
  )
}
