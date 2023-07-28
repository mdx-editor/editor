/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { PhrasingContent } from 'mdast'
import React from 'react'
import { NestedLexicalEditor, useMdastNodeUpdater } from '../plugins/core/NestedLexicalEditor'
import { PropertyPopover } from '../plugins/core/PropertyPopover'
import styles from '../styles/ui.module.css'
import { DirectiveEditorProps } from '../plugins/directives/realmPlugin'
import { Directive } from 'mdast-util-directive'

export const GenericDirectiveEditor: React.FC<DirectiveEditorProps> = ({ mdastNode, descriptor }) => {
  const updateMdastNode = useMdastNodeUpdater()

  const properties = React.useMemo(() => {
    return descriptor.attributes.reduce((acc, attributeName) => {
      acc[attributeName] = (mdastNode.attributes || {})[attributeName] || ''
      return acc
    }, {} as Record<string, string>)
  }, [mdastNode, descriptor])

  const onChange = React.useCallback(
    (values: Record<string, string>) => {
      updateMdastNode({ attributes: Object.fromEntries(Object.entries(values).filter(([, value]) => value !== '')) })
    },
    [updateMdastNode]
  )

  return (
    <div className={mdastNode.type === 'textDirective' ? styles.inlineEditor : styles.blockEditor}>
      {descriptor.attributes.length == 0 && descriptor.hasChildren && mdastNode.type !== 'textDirective' ? (
        <span className={styles.genericComponentName}>{mdastNode.name}</span>
      ) : null}

      {descriptor.attributes.length > 0 ? (
        <PropertyPopover properties={properties} title={mdastNode.name || ''} onChange={onChange} />
      ) : null}
      {descriptor.hasChildren ? (
        <NestedLexicalEditor<Directive>
          block={mdastNode.type === 'containerDirective'}
          getContent={(node) => node.children as PhrasingContent[]}
          getUpdatedMdastNode={(mdastNode, children: any) => {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            return { ...mdastNode, children }
          }}
        />
      ) : (
        <span className={styles.genericComponentName}>{mdastNode.name}</span>
      )}
    </div>
  )
}
