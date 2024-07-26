import React, { useEffect, useState } from 'react'
import { IS_CODE } from '../../../FormatConstants'
import { applyFormat$, currentFormat$, iconComponentFor$, useTranslation } from '../../core'
import { MultipleChoiceToggleGroup } from '.././primitives/toolbar'
import { useCellValues, usePublisher } from '@mdxeditor/gurx'
import { TextFormatType } from 'lexical'
import styles from '@/styles/ui.module.css'

/**
 * A toolbar component that lets the user toggle code formatting.
 * Use for inline `code` elements (like variables, methods, etc).
 * @group Toolbar Components
 */
export const CodeToggle: React.FC = () => {
  const [currentFormat, iconComponentFor] = useCellValues(currentFormat$, iconComponentFor$)
  const applyFormat = usePublisher(applyFormat$)
  const t = useTranslation()

  const codeIsOn = (currentFormat & IS_CODE) !== 0

  const title = codeIsOn ? t('toolbar.removeInlineCode', 'Remove code format') : t('toolbar.inlineCode', 'Inline code format')

  const [appliedFormats, setAppliedFormats] = useState<string[]>([])
  useEffect(() => {
    setAppliedFormats([codeIsOn ? 'code' : null].filter((f) => !!f) as string[])
  }, [currentFormat])

  const handleApplyFormatDiff = (diff: string[]) => {
    ;(diff as TextFormatType[]).forEach(applyFormat)
  }

  return (
    <div className={styles.toolbarGroupOfGroups}>
      <MultipleChoiceToggleGroup
        value={appliedFormats}
        onValueChange={setAppliedFormats}
        onValueChangeDiff={handleApplyFormatDiff}
        items={[{ title: title, contents: iconComponentFor('code'), value: 'code' }]}
      />
    </div>
  )
}
