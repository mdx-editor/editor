/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { PhrasingContent } from 'mdast'
import { MdxJsxAttribute, MdxJsxFlowElement, MdxJsxTextElement } from 'mdast-util-mdx-jsx'
import React from 'react'
import { NestedLexicalEditor, useMdastNodeUpdater } from '../plugins/core/NestedLexicalEditor'
import { PropertyPopover } from '../plugins/core/PropertyPopover'
import styles from '../ui/styles.module.css'
import { JsxEditorProps } from '../plugins/jsx/realmPlugin'

export const GenericJsxEditor: React.FC<JsxEditorProps> = ({ mdastNode, descriptor }) => {
  const updateMdastNode = useMdastNodeUpdater()

  const properties = React.useMemo(() => {
    return descriptor.props.reduce((acc, descriptor) => {
      const attribute = mdastNode.attributes.find((attr) => (attr as MdxJsxAttribute).name === descriptor.name)
      if (attribute) {
        acc[descriptor.name] = attribute.value as string
      } else {
        acc[descriptor.name] = ''
      }
      return acc
    }, {} as Record<string, string>)
  }, [mdastNode, descriptor])

  const onChange = React.useCallback(
    (values: Record<string, string>) => {
      const newAttributes = mdastNode.attributes.slice()

      Object.entries(values).forEach(([key, value]) => {
        const attributeToUpdate = newAttributes.find((attr) => (attr as MdxJsxAttribute).name === key)
        if (value === '') {
          if (attributeToUpdate) {
            newAttributes.splice(newAttributes.indexOf(attributeToUpdate), 1)
          }
        } else {
          if (attributeToUpdate) {
            attributeToUpdate.value = value
          } else {
            newAttributes.push({
              type: 'mdxJsxAttribute',
              name: key,
              value: value
            })
          }
        }
      })
      updateMdastNode({ attributes: newAttributes })
    },
    [mdastNode, updateMdastNode]
  )

  return (
    <div className={descriptor.kind === 'text' ? styles.inlineEditor : styles.blockEditor}>
      {descriptor.props.length == 0 && descriptor.hasChildren && descriptor.kind === 'flow' ? (
        <span className={styles.genericComponentName}>{mdastNode.name}</span>
      ) : null}

      {descriptor.props.length > 0 ? <PropertyPopover properties={properties} title={mdastNode.name || ''} onChange={onChange} /> : null}
      {descriptor.hasChildren ? (
        <NestedLexicalEditor<MdxJsxTextElement | MdxJsxFlowElement>
          block={descriptor.kind === 'flow'}
          getContent={(node) => node.children as PhrasingContent[]}
          getUpdatedMdastNode={(mdastNode, children) => {
            return { ...mdastNode, children } as any
          }}
        />
      ) : (
        <span className={styles.genericComponentName}>{mdastNode.name}</span>
      )}
    </div>
  )
}
