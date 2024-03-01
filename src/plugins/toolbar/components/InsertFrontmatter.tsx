import { useI18n } from '@/i18n/I18nProvider'
import { useCellValues, usePublisher } from '@mdxeditor/gurx'
import classNames from 'classnames'
import React from 'react'
import styles from '../../../styles/ui.module.css'
import { iconComponentFor$ } from '../../core'
import { hasFrontmatter$, insertFrontmatter$ } from '../../frontmatter'
import { ButtonWithTooltip } from '.././primitives/toolbar'

/**
 * A toolbar button that allows the user to insert a {@link https://jekyllrb.com/docs/front-matter/ | front-matter} editor (if one is not already present).
 * For this to work, you need to have the `frontmatterPlugin` plugin enabled.
 * @group Toolbar Components
 */
export const InsertFrontmatter: React.FC = () => {
  const i18n = useI18n()
  const insertFrontmatter = usePublisher(insertFrontmatter$)
  const [hasFrontmatter, iconComponentFor] = useCellValues(hasFrontmatter$, iconComponentFor$)

  return (
    <ButtonWithTooltip
      title={hasFrontmatter ? i18n.toolbar.editFrontmatter : i18n.toolbar.insertFrontmatter}
      className={classNames({
        [styles.activeToolbarButton]: hasFrontmatter
      })}
      onClick={() => insertFrontmatter()}
    >
      {iconComponentFor('frontmatter')}
    </ButtonWithTooltip>
  )
}
