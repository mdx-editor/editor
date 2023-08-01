/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import React from 'react'
import { NestedLexicalEditor, useNestedEditorContext } from '../plugins/core/NestedLexicalEditor'
import { DirectiveDescriptor } from '../plugins/directives'
import { ContainerDirective } from 'mdast-util-directive'

export const ADMONITION_TYPES = ['note', 'tip', 'danger', 'info', 'caution'] as const
export type AdmonitionKind = (typeof ADMONITION_TYPES)[number]

export const AdmonitionDirectiveDescriptor: DirectiveDescriptor = {
  name: 'admonition',
  attributes: [],
  hasChildren: true,
  testNode(node) {
    return ADMONITION_TYPES.includes(node.name as AdmonitionKind)
  },
  Editor({ mdastNode }) {
    const {
      config: { theme },
      focusEmitter
    } = useNestedEditorContext()
    return (
      <div className={theme.admonition[mdastNode.name]}>
        <NestedLexicalEditor<ContainerDirective>
          focusEmitter={focusEmitter}
          getContent={(node) => node.children}
          getUpdatedMdastNode={(mdastNode, children: any) => ({ ...mdastNode, children })}
        />
      </div>
    )
  }
}
