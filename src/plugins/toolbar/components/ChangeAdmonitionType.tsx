import { AdmonitionKind } from 'lexical'
import React from 'react'
import { editorInFocus$, rootEditor$ } from '../../core'
import { Select } from '.././primitives/select'
import { DirectiveNode } from '../../directives/DirectiveNode'
import { ADMONITION_TYPES } from '../../../directive-editors/AdmonitionDirectiveDescriptor'
import { useCellValues } from '@mdxeditor/gurx'

/**
 * A component that allows the user to change the admonition type of the current selection.
 * For this component to work, you must pass the {@link AdmonitionDirectiveDescriptor} to the `directivesPlugin` `directiveDescriptors` parameter.
 * @group Toolbar Components
 */
export const ChangeAdmonitionType = () => {
  const [editorInFocus, rootEditor] = useCellValues(editorInFocus$, rootEditor$)
  const admonitionNode = editorInFocus!.rootNode as DirectiveNode
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
      triggerTitle="Select admonition type"
      placeholder="Admonition type"
      items={ADMONITION_TYPES.map((type) => ({ label: type.replace(/^./, (l) => l.toUpperCase()), value: type }))}
    />
  )
}
