/* eslint-disable @typescript-eslint/no-unsafe-argument */
import * as RadixPopover from '@radix-ui/react-popover'
import { MdxJsxAttribute, MdxJsxFlowElement, MdxJsxTextElement } from 'mdast-util-mdx-jsx'
import React from 'react'
import { NestedLexicalEditor, useMdastNodeUpdater } from '../plugins/core/NestedLexicalEditor'
import { PhrasingContent } from 'mdast'
import { useForm } from 'react-hook-form'
import styles from '../ui/styles.module.css'
import { PopoverPortal, PopoverContent } from '../plugins/core/ui/PopoverUtils'
import { JsxComponentDescriptor, JsxEditorProps, MdastJsx } from '../types/JsxComponentDescriptors'
import SettingsIcon from '../ui/icons/settings.svg'

export const GenericJsxEditor: React.FC<JsxEditorProps> = ({ mdastNode, descriptor }) => {
  return (
    <div className={descriptor.kind === 'text' ? styles.inlineEditor : styles.blockEditor}>
      {descriptor.props.length == 0 && descriptor.hasChildren && descriptor.kind === 'flow' ? (
        <span className={styles.jsxComponentTitle}>{mdastNode.name}</span>
      ) : null}

      {descriptor.props.length > 0 ? <PropertyPopover descriptor={descriptor} mdastNode={mdastNode} /> : null}
      {descriptor.hasChildren ? (
        <NestedLexicalEditor<MdxJsxTextElement | MdxJsxFlowElement>
          block={descriptor.kind === 'flow'}
          getContent={(node) => node.children as PhrasingContent[]}
          getUpdatedMdastNode={(mdastNode, children) => {
            return { ...mdastNode, children } as any
          }}
        />
      ) : (
        <span className={styles.jsxComponentTitle}>{mdastNode.name}</span>
      )}
    </div>
  )
}

interface PropertyPopoverProps {
  descriptor: JsxComponentDescriptor
  mdastNode: MdastJsx
}

const PropertyPopover: React.FC<PropertyPopoverProps> = ({ mdastNode, descriptor }) => {
  const [open, setOpen] = React.useState(false)
  const updateMdastNode = useMdastNodeUpdater()

  const defaultValues = React.useMemo(() => {
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

  const { register, handleSubmit, reset } = useForm({ defaultValues })

  return (
    <RadixPopover.Root open={open} onOpenChange={(v) => setOpen(v)}>
      <RadixPopover.Trigger className={styles.iconButton}>
        <SettingsIcon style={{ display: 'block' }} />
      </RadixPopover.Trigger>
      <PopoverPortal>
        <PopoverContent>
          <form
            onSubmit={handleSubmit((attributeValues) => {
              const newAttributes = mdastNode.attributes.slice()

              Object.entries(attributeValues).forEach(([key, value]) => {
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
              setOpen(false)
            })}
          >
            <h3 className={styles.propertyPanelTitle}>{mdastNode.name} Attributes</h3>
            <table className={styles.propertyEditorTable}>
              <thead>
                <tr>
                  <th className={styles.readOnlyColumnCell}>Attribute</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                {descriptor.props.map((propDescriptor) => (
                  <tr key={propDescriptor.name}>
                    <th className={styles.readOnlyColumnCell}> {propDescriptor.name} </th>
                    <td>
                      <input {...register(propDescriptor.name)} className={styles.propertyEditorInput} />
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={2}>
                    <div className={styles.buttonsFooter}>
                      <button type="submit" className={styles.primaryButton}>
                        Save
                      </button>
                      <button
                        type="reset"
                        className={styles.secondaryButton}
                        onClick={(e) => {
                          e.preventDefault()
                          reset(defaultValues)
                          setOpen(false)
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </td>
                </tr>
              </tfoot>
            </table>
          </form>
        </PopoverContent>
      </PopoverPortal>
    </RadixPopover.Root>
  )
}
