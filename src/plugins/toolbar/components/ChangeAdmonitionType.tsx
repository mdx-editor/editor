import { AdmonitionKind } from 'lexical'
import React from 'react'
import { editorInFocus$, rootEditor$ } from '../../core'
import { Select } from '.././primitives/select'
import { DirectiveNode } from '../../directives/DirectiveNode'
import { ADMONITION_TYPES } from '../../../directive-editors/AdmonitionDirectiveDescriptor'
import { useCellValues } from '@mdxeditor/gurx'
import { useI18n } from '@/plugins/core/i18n'

/**
 * A component that allows the user to change the admonition type of the current selection.
 * For this component to work, you must pass the {@link AdmonitionDirectiveDescriptor} to the `directivesPlugin` `directiveDescriptors` parameter.
 * @group Toolbar Components
 */
export const ChangeAdmonitionType = () => {
  const i18n = useI18n()
  const [editorInFocus, rootEditor] = useCellValues(editorInFocus$, rootEditor$)
  const admonitionNode = editorInFocus!.rootNode as DirectiveNode

  const ADMONITION_LABELS_MAP: Record<(typeof ADMONITION_TYPES)[number], string> = {
    note: i18n.admonitions.note,
    tip: i18n.admonitions.tip,
    danger: i18n.admonitions.danger,
    info: i18n.admonitions.info,
    caution: i18n.admonitions.caution
  } as const

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
      triggerTitle={i18n.admonitions.changeType}
      placeholder={i18n.admonitions.placeholder}
      items={ADMONITION_TYPES.map((type) => ({ label: ADMONITION_LABELS_MAP[type], value: type }))}
    />
  )
}
