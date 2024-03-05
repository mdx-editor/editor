import { AdmonitionKind } from 'lexical'
import React from 'react'
import { Translation, editorInFocus$, rootEditor$, useTranslation } from '../../core'
import { Select } from '.././primitives/select'
import { DirectiveNode } from '../../directives/DirectiveNode'
import { ADMONITION_TYPES } from '../../../directive-editors/AdmonitionDirectiveDescriptor'
import { useCellValues } from '@mdxeditor/gurx'

export function admonitionLabelsMap(t: Translation): Record<(typeof ADMONITION_TYPES)[number], string> {
  return {
    note: t('admonitions.note', 'Note'),
    tip: t('admonitions.tip', 'Tip'),
    danger: t('admonitions.danger', 'Danger'),
    info: t('admonitions.info', 'Info'),
    caution: t('admonitions.caution', 'Caution')
  } as const
}
/**
 * A component that allows the user to change the admonition type of the current selection.
 * For this component to work, you must pass the {@link AdmonitionDirectiveDescriptor} to the `directivesPlugin` `directiveDescriptors` parameter.
 * @group Toolbar Components
 */
export const ChangeAdmonitionType = () => {
  const [editorInFocus, rootEditor] = useCellValues(editorInFocus$, rootEditor$)
  const admonitionNode = editorInFocus!.rootNode as DirectiveNode
  const t = useTranslation()

  const labels = admonitionLabelsMap(t)

  return (
    <Select<AdmonitionKind>
      value={admonitionNode.getMdastNode().name as AdmonitionKind}
      onChange={(name) => {
        rootEditor?.update(() => {
          admonitionNode.setMdastNode({ ...admonitionNode.getMdastNode(), name: name })
          setTimeout(() => {
            rootEditor?.update(() => {
              admonitionNode.getLatest().select()
            })
          }, 80)
        })
      }}
      triggerTitle={t('admonitions.changeType', 'Select admonition type')}
      placeholder={t('admonitions.placeholder', 'Admonition type')}
      items={ADMONITION_TYPES.map((type) => ({ label: labels[type], value: type }))}
    />
  )
}
