import * as Dialog from '@radix-ui/react-dialog'
import classNames from 'classnames'
import YamlParser from 'js-yaml'
import React from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { frontmatterDialogOpen$, removeFrontmatter$ } from '.'
import styles from '../../styles/ui.module.css'
import { editorRootElementRef$, iconComponentFor$, readOnly$, useTranslation } from '../core'
import { useCellValues, usePublisher } from '@mdxeditor/gurx'

type YamlConfig = { key: string; value: unknown }[]

/**
 * Props passed to the frontmatter editor component.
 * @group Frontmatter
 */
export interface FrontmatterEditorProps {
  /** The frontmatter contents, without the enclosing `---` delimiters. */
  yaml: string
  /** Replaces the frontmatter contents, without the enclosing `---` delimiters. */
  onChange: (yaml: string) => void
}

/**
 * The default key-value frontmatter editor.
 * @group Frontmatter
 */
export const FrontmatterEditor = ({ yaml, onChange }: FrontmatterEditorProps) => {
  const [frontmatterDialogOpen] = useCellValues(frontmatterDialogOpen$)
  // Mount a fresh form on reopen, and when external edits replace the YAML.
  return frontmatterDialogOpen ? <FrontmatterForm key={yaml} yaml={yaml} onChange={onChange} /> : null
}

const FrontmatterForm = ({ yaml, onChange }: FrontmatterEditorProps) => {
  const [readOnly, editorRootElementRef, iconComponentFor, frontmatterDialogOpen] = useCellValues(
    readOnly$,
    editorRootElementRef$,
    iconComponentFor$,
    frontmatterDialogOpen$
  )
  const t = useTranslation()
  const setFrontmatterDialogOpen = usePublisher(frontmatterDialogOpen$)
  const removeFrontmatter = usePublisher(removeFrontmatter$)
  const { yamlConfig, invalid } = React.useMemo(() => {
    try {
      const value: unknown = YamlParser.load(yaml, {
        schema: YamlParser.CORE_SCHEMA,
        listener: (event, state) => {
          // Do not round existing large integers while saving unrelated fields.
          if (
            event === 'close' &&
            typeof state.result === 'number' &&
            Number.isInteger(state.result) &&
            !Number.isSafeInteger(state.result)
          ) {
            throw new Error('Unsafe integer')
          }
        }
      })
      if (value === undefined) return { yamlConfig: [], invalid: false }
      if (value === null || typeof value !== 'object' || Array.isArray(value)) return { yamlConfig: [], invalid: true }
      // The form library clones defaults recursively; recursive aliases cannot
      // safely become form values. Leave their original source untouched.
      JSON.stringify(value)
      return { yamlConfig: Object.entries(value as Record<string, unknown>).map(([key, value]) => ({ key, value })), invalid: false }
    } catch {
      return { yamlConfig: [], invalid: true }
    }
  }, [yaml])

  const { register, control, handleSubmit } = useForm({
    defaultValues: {
      yamlConfig
    }
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'yamlConfig'
  })
  // Field-array operations refresh item.value from the current form. Keep the
  // initial YAML value by stable row identity so edits can still be reverted.
  const originalValues = React.useRef(new Map<string, unknown>())

  const onSubmit = React.useCallback(
    ({ yamlConfig: updatedConfig }: { yamlConfig: YamlConfig }) => {
      if (readOnly || invalid) return
      // Compare values, not just dirty fields: edit-then-revert must preserve
      // comments, quoting and whitespace just like an untouched Save.
      const options = { schema: YamlParser.CORE_SCHEMA }
      // Form defaults are cloned, so alias identity must not count as an edit.
      const comparisonOptions = { ...options, noRefs: true }
      if (YamlParser.dump(updatedConfig, comparisonOptions) === YamlParser.dump(yamlConfig, comparisonOptions)) {
        setFrontmatterDialogOpen(false)
        return
      }
      if (updatedConfig.length === 0) {
        removeFrontmatter()
        setFrontmatterDialogOpen(false)
        return
      }
      const yaml = Object.fromEntries(updatedConfig.filter(({ key }) => key).map(({ key, value }) => [key, value] as const))
      onChange(YamlParser.dump(yaml, options).trimEnd())
      setFrontmatterDialogOpen(false)
    },
    [onChange, setFrontmatterDialogOpen, removeFrontmatter, yamlConfig, readOnly, invalid]
  )

  return (
    <>
      <Dialog.Root
        open={frontmatterDialogOpen}
        onOpenChange={(open) => {
          setFrontmatterDialogOpen(open)
        }}
      >
        <Dialog.Portal container={editorRootElementRef?.current}>
          <Dialog.Overlay className={styles.dialogOverlay} />
          <Dialog.Content className={styles.largeDialogContent} data-editor-type="frontmatter">
            <Dialog.Title className={styles.dialogTitle}>{t('frontmatterEditor.title', 'Edit document frontmatter')}</Dialog.Title>
            <Dialog.Description className={styles.visuallyHidden}>
              {t('frontmatterEditor.dialogDescription', 'Add, edit, or remove the key-value entries of the document frontmatter.')}
            </Dialog.Description>
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
              {invalid && (
                <p role="alert">
                  {t(
                    'frontmatterEditor.invalidYaml',
                    'This frontmatter cannot be edited as key-value fields. Edit the Markdown source instead.'
                  )}
                </p>
              )}
              <table className={styles.propertyEditorTable}>
                <colgroup>
                  <col />
                  <col />
                  <col />
                </colgroup>
                <thead>
                  <tr>
                    <th>{t('frontmatterEditor.key', 'Key')}</th>
                    <th>{t('frontmatterEditor.value', 'Value')}</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {fields.map((item, index) => {
                    if (!originalValues.current.has(item.id)) originalValues.current.set(item.id, item.value)
                    const original = originalValues.current.get(item.id)
                    return (
                      <tr key={item.id}>
                        <td>
                          <TableInput
                            {...register(`yamlConfig.${index}.key`, { required: true })}
                            aria-label={t('frontmatterEditor.key', 'Key')}
                            autofocusIfEmpty
                            readOnly={readOnly}
                          />
                        </td>
                        <td>
                          <TableInput
                            {...register(`yamlConfig.${index}.value`, {
                              // Text inputs stringify their values. Restore the original
                              // YAML type if a field is unchanged or edited then reverted.
                              setValueAs: (value: unknown) => {
                                if (
                                  original === null ||
                                  typeof original === 'string' ||
                                  typeof original === 'number' ||
                                  typeof original === 'boolean'
                                ) {
                                  return value === String(original ?? '') ? original : value
                                }
                                return original
                              }
                            })}
                            aria-label={t('frontmatterEditor.value', 'Value')}
                            readOnly={readOnly || (typeof original === 'object' && original !== null)}
                          />
                        </td>
                        <td>
                          <button
                            type="button"
                            onClick={() => {
                              remove(index)
                            }}
                            className={styles.iconButton}
                            disabled={readOnly}
                          >
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
                        disabled={readOnly || invalid}
                        className={classNames(styles.primaryButton, styles.smallButton)}
                        type="button"
                        onClick={() => {
                          append({ key: '', value: '' })
                        }}
                      >
                        {t('frontmatterEditor.addEntry', 'Add entry')}
                      </button>
                    </td>
                  </tr>
                </tfoot>
              </table>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-2)' }}>
                <button type="submit" disabled={readOnly || invalid} className={styles.primaryButton}>
                  {t('dialogControls.save', 'Save')}
                </button>
                <button type="reset" className={styles.secondaryButton}>
                  {t('dialogControls.cancel', 'Cancel')}
                </button>
              </div>
            </form>
            <Dialog.Close asChild>
              <button className={styles.dialogCloseButton} aria-label={t('dialogControls.cancel', 'Cancel')}>
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
