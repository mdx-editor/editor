/* eslint-disable @typescript-eslint/no-unsafe-argument */
import * as RadixPopover from '@radix-ui/react-popover'
import { MdxJsxAttribute, MdxJsxFlowElement, MdxJsxTextElement } from 'mdast-util-mdx-jsx'
import React from 'react'
// import ExtensionIcon from '../../ui/icons/extension.svg'
import { LexicalEditor } from 'lexical'
import { NestedLexicalEditor, NestedEditorsContext, useMdastNodeUpdater, useNestedEditorContext } from '../core/NestedLexicalEditor'
import { PhrasingContent } from 'mdast'
import { useForm } from 'react-hook-form'
import SettingsIcon from '../../ui/icons/settings.svg'
import { jsxPluginHooks } from './realmPlugin'
import { MdastJsx } from './LexicalJsxNode'
import styles from '../../ui/styles.module.css'
import { PopoverPortal, PopoverContent } from '../core/ui/PopoverUtils'

function useJsxDescriptor(mdastNode: MdastJsx) {
  const [jsxComponentDescriptors] = jsxPluginHooks.useEmitterValues('jsxComponentDescriptors')
  return jsxComponentDescriptors.find((descriptor) => descriptor.name === mdastNode.name)!
}

export interface JsxEditorProps {
  /** The Lexical editor that contains the node */
  parentEditor: LexicalEditor
  /** The Lexical node that is being edited */
  lexicalJsxNode: {
    setMdastNode: (mdastNode: MdxJsxTextElement | MdxJsxFlowElement) => void
  }
  /** The MDAST node that is being edited */
  mdastNode: MdxJsxTextElement | MdxJsxFlowElement
}

export function JsxEditor(props: JsxEditorProps) {
  const { mdastNode } = props
  const descriptor = useJsxDescriptor(mdastNode)

  return (
    <NestedEditorsContext.Provider
      value={{
        mdastNode: mdastNode,
        parentEditor: props.parentEditor,
        lexicalNode: props.lexicalJsxNode
      }}
    >
      <div className={descriptor.kind === 'text' ? styles.inlineEditor : styles.blockEditor}>
        {descriptor.props.length == 0 && descriptor.hasChildren && descriptor.kind === 'flow' ? (
          <span className={styles.jsxComponentTitle}>{mdastNode.name}</span>
        ) : null}

        {descriptor.props.length > 0 ? <PropertyPopover /> : null}
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
    </NestedEditorsContext.Provider>
  )
}

const PropertyPopover: React.FC = () => {
  const [open, setOpen] = React.useState(false)
  const mdastNode = useNestedEditorContext<MdastJsx>().mdastNode
  const updateMdastNode = useMdastNodeUpdater()
  const descriptor = useJsxDescriptor(mdastNode)

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
