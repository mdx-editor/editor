import React from 'react'
import { ButtonWithTooltip } from '.././primitives/toolbar'
import { hasFrontmatter$, insertFrontmatter$ } from '../../frontmatter'
import styles from '../../../styles/ui.module.css'
import classNames from 'classnames'
import { useCellValues, usePublisher } from '@mdxeditor/gurx'
import { iconComponentFor$ } from '../../core'

/**
 * A toolbar button that allows the user to insert a {@link https://jekyllrb.com/docs/front-matter/ | front-matter} editor (if one is not already present).
 * For this to work, you need to have the `frontmatterPlugin` plugin enabled.
 * @group Toolbar Components
 */
export const InsertFrontmatter: React.FC = () => {
  const insertFrontmatter = usePublisher(insertFrontmatter$)
  const [hasFrontmatter, iconComponentFor] = useCellValues(hasFrontmatter$, iconComponentFor$)

  return (
    <ButtonWithTooltip
      title={hasFrontmatter ? 'Edit frontmatter' : 'Insert frontmatter'}
      className={classNames({
        [styles.activeToolbarButton]: hasFrontmatter
      })}
      onClick={() => insertFrontmatter()}
    >
      {iconComponentFor('frontmatter')}
    </ButtonWithTooltip>
  )
}
