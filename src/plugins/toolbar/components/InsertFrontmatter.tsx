import React from 'react'
import { ButtonWithTooltip } from '.././primitives/toolbar'
import { frontmatterPluginHooks } from '../../frontmatter'
import styles from '../../../styles/ui.module.css'
import classNames from 'classnames'

/**
 * A toolbar button that allows the user to insert a {@link https://jekyllrb.com/docs/front-matter/ | front-matter} editor (if one is not already present).
 * For this to work, you need to have the `frontmatterPlugin` plugin enabled.
 */
export const InsertFrontmatter: React.FC = () => {
  const insertFrontmatter = frontmatterPluginHooks.usePublisher('insertFrontmatter')
  const [hasFrontmatter] = frontmatterPluginHooks.useEmitterValues('hasFrontmatter')
  const [iconComponentFor] = frontmatterPluginHooks.useEmitterValues('iconComponentFor')
  return (
    <ButtonWithTooltip
      title={hasFrontmatter ? 'Edit frontmatter' : 'Insert frontmatter'}
      className={classNames({
        [styles.activeToolbarButton]: hasFrontmatter
      })}
      onClick={insertFrontmatter.bind(null, true)}
    >
      {iconComponentFor('frontmatter')}
    </ButtonWithTooltip>
  )
}
