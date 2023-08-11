/* eslint-disable @typescript-eslint/no-unsafe-argument */
import * as RadixPopover from '@radix-ui/react-popover'
import React from 'react'
import { useForm } from 'react-hook-form'
import SettingsIcon from '../../icons/settings.svg'
import styles from '../../styles/ui.module.css'

import { PopoverContent, PopoverPortal } from './ui/PopoverUtils'

/**
 * The properties of the {@link PropertyPopover} React component.
 */
export interface PropertyPopoverProps {
  /**
   * The properties to edit. The key is the name of the property, and the value is the initial value.
   */
  properties: Record<string, string>
  /**
   * Triggered when the user edits the property values.
   */
  onChange: (values: Record<string, string>) => void
  /**
   * The title to display in the popover.
   */
  title: string
}

/**
 * A React component that can be used in custom editors to edit the properties of the node.
 * Displays a simple, static key/value editing UI in a popover.
 */
export const PropertyPopover: React.FC<PropertyPopoverProps> = ({ title, properties, onChange }) => {
  const [open, setOpen] = React.useState(false)

  const { register, handleSubmit, reset } = useForm({ defaultValues: properties })

  return (
    <RadixPopover.Root open={open} onOpenChange={(v) => setOpen(v)}>
      <RadixPopover.Trigger className={styles.iconButton}>
        <SettingsIcon style={{ display: 'block' }} />
      </RadixPopover.Trigger>
      <PopoverPortal>
        <PopoverContent>
          <form
            onSubmit={handleSubmit((values) => {
              onChange(values)
              setOpen(false)
            })}
          >
            <h3 className={styles.propertyPanelTitle}>{title} Attributes</h3>
            <table className={styles.propertyEditorTable}>
              <thead>
                <tr>
                  <th className={styles.readOnlyColumnCell}>Attribute</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(properties).map((propName) => (
                  <tr key={propName}>
                    <th className={styles.readOnlyColumnCell}> {propName} </th>
                    <td>
                      <input {...register(propName)} className={styles.propertyEditorInput} />
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
                          reset(properties)
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
