import * as Dialog from '@radix-ui/react-dialog'
import classNames from 'classnames'
import YamlParser from 'js-yaml'
import React from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { frontmatterPluginHooks } from '.'
import styles from '../../styles/ui.module.css'
import { corePluginHooks } from '../core'

type YamlConfig = { key: string; value: string }[]

export interface FrontmatterEditorProps {
  yaml: string
  onChange: (yaml: string) => void
}

export const FrontmatterEditor = (props: FrontmatterEditorProps)  => {
  const [readOnly, editorRootElementRef, iconComponentFor] = corePluginHooks.useEmitterValues(
    'readOnly',
    'editorRootElementRef',
    'iconComponentFor'
  )
  const [frontmatterDialogOpen] = frontmatterPluginHooks.useEmitterValues('frontmatterDialogOpen')
  const setFrontmatterDialogOpen = frontmatterPluginHooks.usePublisher('frontmatterDialogOpen')
  const removeFrontmatter = frontmatterPluginHooks.usePublisher('removeFrontmatter')
  const yamlConfig = React.useMemo<YamlConfig>(() => {
    if (!props.yaml) {
      return []
    }
    return Object.entries(YamlParser.load(props.yaml) as Record<string, string>).map(([key, value]) => ({ key, value }))
  }, [props.yaml])

  const { register, control, handleSubmit } = useForm({
    defaultValues: {
      yamlConfig
    }
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'yamlConfig'
  })

  const onSubmit = React.useCallback(
    ({ yamlConfig }: { yamlConfig: YamlConfig }) => {
      if (yamlConfig.length === 0) {
        removeFrontmatter(true)
        setFrontmatterDialogOpen(false)
        return
      }
      const yaml = yamlConfig.reduce((acc, { key, value }) => {
        if (key && value) {
          acc[key] = value
        }
        return acc
      }, {} as Record<string, string>)
      props.onChange(YamlParser.dump(yaml).trim())
      setFrontmatterDialogOpen(false)
    },
    [props.onChange, setFrontmatterDialogOpen, removeFrontmatter]
  )

  return (
    <>
      <Dialog.Root open={frontmatterDialogOpen} onOpenChange={(open) => setFrontmatterDialogOpen(open)}>
        <Dialog.Portal container={editorRootElementRef?.current}>
          <Dialog.Overlay className={styles.dialogOverlay} />
          <Dialog.Content className={styles.largeDialogContent} data-editor-type="frontmatter">
            <Dialog.Title className={styles.dialogTitle}>Edit document frontmatter</Dialog.Title>
            <form
              onSubmit={(e) => {
                void handleSubmit(onSubmit)(e)
                e.stopPropagation()
              }}
              onReset={(e) => {
                e.stopPropagation()
                setFrontmatterDialogOpen(false)
              }}
            >
              <table className={styles.propertyEditorTable}>
                <colgroup>
                  <col />
                  <col />
                  <col />
                </colgroup>
                <thead>
                  <tr>
                    <th>Key</th>
                    <th>Value</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {fields.map((item, index) => {
                    return (
                      <tr key={item.id}>
                        <td>
                          <TableInput {...register(`yamlConfig.${index}.key`, { required: true })} autofocusIfEmpty readOnly={readOnly} />
                        </td>
                        <td>
                          <TableInput {...register(`yamlConfig.${index}.value`, { required: true })} readOnly={readOnly} />
                        </td>
                        <td>
                          <button type="button" onClick={() => remove(index)} className={styles.iconButton} disabled={readOnly}>
                            {iconComponentFor('delete_big')}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr>
                    <td>
                      <button
                        disabled={readOnly}
                        className={classNames(styles.primaryButton, styles.smallButton)}
                        type="button"
                        onClick={() => {
                          append({ key: '', value: '' })
                        }}
                      >
                        Add entry
                      </button>
                    </td>
                  </tr>
                </tfoot>
              </table>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-2)' }}>
                <button type="submit" className={styles.primaryButton}>
                  Save
                </button>
                <button type="reset" className={styles.secondaryButton}>
                  Cancel
                </button>
              </div>
            </form>
            <Dialog.Close asChild>
              <button className={styles.dialogCloseButton} aria-label="Close">
                {iconComponentFor('close')}
              </button>
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  )
}

const TableInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { autofocusIfEmpty?: boolean; autoFocus?: boolean; value?: string }
>(({ className, autofocusIfEmpty: _, ...props }, ref) => {
  return <input className={classNames(styles.propertyEditorInput, className)} {...props} ref={ref} />
})
