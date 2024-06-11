/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { PhrasingContent } from 'mdast'
import {
  MdxJsxAttribute,
  MdxJsxAttributeValueExpression,
  MdxJsxExpressionAttribute,
  MdxJsxFlowElement,
  MdxJsxTextElement
} from 'mdast-util-mdx-jsx'
import React from 'react'
import { NestedLexicalEditor, useMdastNodeUpdater } from '../plugins/core/NestedLexicalEditor'
import { PropertyPopover } from '../plugins/core/PropertyPopover'
import styles from '../styles/ui.module.css'
import { JsxEditorProps } from '@/plugins/jsx/utils'

const isExpressionValue = (value: string | MdxJsxAttributeValueExpression | null | undefined): value is MdxJsxAttributeValueExpression => {
  if (value !== null && typeof value === 'object' && 'type' in value && 'value' in value && typeof value.value === 'string') {
    return true
  }

  return false
}

const isStringValue = (value: string | MdxJsxAttributeValueExpression | null | undefined): value is string => typeof value === 'string'

const isMdxJsxAttribute = (value: MdxJsxAttribute | MdxJsxExpressionAttribute): value is MdxJsxAttribute => {
  if (value.type === 'mdxJsxAttribute' && typeof value.name === 'string') {
    return true
  }

  return false
}

/**
 * A generic editor that can be used as an universal UI for any JSX element.
 * Allows editing of the element content and properties.
 * Use this editor for the {@link JsxComponentDescriptor} Editor option.
 * @group JSX
 */
export const GenericJsxEditor: React.FC<JsxEditorProps> = ({ mdastNode, descriptor }) => {
  const updateMdastNode = useMdastNodeUpdater()

  const properties = React.useMemo(
    () =>
      descriptor.props.reduce<Record<string, string>>((acc, { name }) => {
        const attribute = mdastNode.attributes.find((attr) => (isMdxJsxAttribute(attr) ? attr.name === name : false))

        if (attribute) {
          if (isExpressionValue(attribute.value)) {
            acc[name] = attribute.value.value
            return acc
          }

          if (isStringValue(attribute.value)) {
            acc[name] = attribute.value
            return acc
          }
        }

        acc[name] = ''
        return acc
      }, {}),
    [mdastNode, descriptor]
  )

  const onChange = React.useCallback(
    (values: Record<string, string>) => {
      const updatedAttributes = Object.entries(values).reduce<typeof mdastNode.attributes>((acc, [name, value]) => {
        if (value === '') {
          return acc
        }

        const property = descriptor.props.find((prop) => prop.name === name)

        if (property?.type === 'expression') {
          acc.push({
            type: 'mdxJsxAttribute',
            name,
            value: { type: 'mdxJsxAttributeValueExpression', value }
          })
          return acc
        }

        acc.push({
          type: 'mdxJsxAttribute',
          name,
          value
        })

        return acc
      }, [])

      updateMdastNode({ attributes: updatedAttributes })
    },
    [mdastNode, updateMdastNode, descriptor]
  )

  const shouldRenderComponentName = descriptor.props.length == 0 && descriptor.hasChildren && descriptor.kind === 'flow'

  return (
    <div className={descriptor.kind === 'text' ? styles.inlineEditor : styles.blockEditor}>
      {shouldRenderComponentName ? <span className={styles.genericComponentName}>{mdastNode.name ?? 'Fragment'}</span> : null}

      {descriptor.props.length > 0 ? <PropertyPopover properties={properties} title={mdastNode.name ?? ''} onChange={onChange} /> : null}

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
