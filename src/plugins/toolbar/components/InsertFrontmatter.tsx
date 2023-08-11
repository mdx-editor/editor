import React from 'react'
import { ButtonWithTooltip } from '.././primitives/toolbar'
import FrontmatterIcon from '../../../icons/frontmatter.svg'
import { frontmatterPluginHooks } from '../../frontmatter'

/**
 * A toolbar button that allows the user to insert a {@link https://jekyllrb.com/docs/front-matter/ | front-matter} editor (if one is not already present).
 * For this to work, you need to have the `frontmatterPlugin` plugin enabled.
 */
export const InsertFrontmatter: React.FC = () => {
  const insertFrontmatter = frontmatterPluginHooks.usePublisher('insertFrontmatter')
  return (
    <ButtonWithTooltip title="Insert frontmatter editor" onClick={insertFrontmatter.bind(null, true)}>
      <FrontmatterIcon />
    </ButtonWithTooltip>
  )
}
