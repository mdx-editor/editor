import * as Dialog from '@radix-ui/react-dialog'
import classNames from 'classnames'
import YamlParser from 'js-yaml'
import React from 'react'
import { emptyValue, parseFrontmatter, serializeFrontmatter, ValueDraft, ValueType } from './frontmatterValues'
import { frontmatterDialogOpen$, removeFrontmatter$ } from '.'
import styles from '../../styles/ui.module.css'
import { editorRootElementRef$, iconComponentFor$, readOnly$, useTranslation } from '../core'
import { useCellValues, usePublisher } from '@mdxeditor/gurx'

export interface FrontmatterEditorProps {
  yaml: string
  onChange: (yaml: string) => void
}

export const FrontmatterEditor = ({ yaml, onChange }: FrontmatterEditorProps) => {
  const [readOnly, editorRootElementRef, iconComponentFor, frontmatterDialogOpen] = useCellValues(
    readOnly$,
    editorRootElementRef$,
    iconComponentFor$,
    frontmatterDialogOpen$
  )
  const setFrontmatterDialogOpen = usePublisher(frontmatterDialogOpen$)
  const removeFrontmatter = usePublisher(removeFrontmatter$)
  return frontmatterDialogOpen ? (
    <FrontmatterDialog
      key={yaml}
      yaml={yaml}
      onChange={onChange}
      readOnly={readOnly}
      container={editorRootElementRef?.current}
      iconComponentFor={iconComponentFor}
      close={() => {
        setFrontmatterDialogOpen(false)
      }}
      removeFrontmatter={removeFrontmatter}
    />
  ) : null
}

function FrontmatterDialog({
  yaml,
  onChange,
  readOnly,
  container,
  iconComponentFor,
  close,
  removeFrontmatter
}: FrontmatterEditorProps & {
  readOnly: boolean
  container: HTMLElement | null | undefined
  iconComponentFor: (name: 'close') => React.ReactNode
  close: () => void
  removeFrontmatter: () => void
}) {
  const t = useTranslation()
  const initial = React.useMemo(() => {
    try {
      return { draft: parseFrontmatter(yaml), error: '' }
    } catch (error) {
      return { draft: null, error: String(error) }
    }
  }, [yaml])
  const [draft, setDraft] = React.useState(initial.draft)
  const [raw, setRaw] = React.useState(yaml)
  const [error, setError] = React.useState(initial.error)
  const [dirty, setDirty] = React.useState(false)
  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    event.stopPropagation()
    if (readOnly) return
    try {
      if (dirty) {
        if (draft) onChange(serializeFrontmatter(draft))
        else {
          // Validate syntax, but permit values unsupported by the field editor.
          YamlParser.load(raw)
          onChange(raw)
        }
      }
      close()
    } catch (error) {
      setError(String(error))
    }
  }

  return (
    <>
      <Dialog.Root
        open={true}
        onOpenChange={(open) => {
          if (!open) close()
        }}
      >
        <Dialog.Portal container={container}>
          <Dialog.Overlay className={styles.dialogOverlay} />
          <Dialog.Content
            className={styles.largeDialogContent}
            style={{ maxHeight: '85vh', overflow: 'auto', width: 'min(640px, 90vw)' }}
            data-editor-type="frontmatter"
          >
            <Dialog.Title className={styles.dialogTitle}>{t('frontmatterEditor.title', 'Edit document frontmatter')}</Dialog.Title>
            <Dialog.Description className={styles.visuallyHidden}>
              {t('frontmatterEditor.dialogDescription', 'Add, edit, or remove the key-value entries of the document frontmatter.')}
            </Dialog.Description>
            <form
              onSubmit={onSubmit}
              onReset={(event) => {
                event.stopPropagation()
                close()
              }}
            >
              {error && <p role="alert">{error}</p>}
              {draft ? (
                <ValueEditor
                  value={draft}
                  label="Frontmatter"
                  readOnly={readOnly}
                  onChange={(value) => {
                    setDraft(value)
                    setDirty(true)
                    setError('')
                  }}
                />
              ) : (
                <label>
                  {t('frontmatterEditor.yaml', 'YAML')}
                  <textarea
                    aria-label="YAML"
                    className={styles.propertyEditorInput}
                    value={raw}
                    readOnly={readOnly}
                    onChange={(event) => {
                      setRaw(event.target.value)
                      setDirty(true)
                    }}
                  />
                </label>
              )}
              <button
                type="button"
                disabled={readOnly}
                className={styles.secondaryButton}
                onClick={() => {
                  if (!readOnly) {
                    removeFrontmatter()
                    close()
                  }
                }}
              >
                {t('frontmatterEditor.remove', 'Remove frontmatter')}
              </button>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-2)' }}>
                <button type="submit" disabled={readOnly} className={styles.primaryButton}>
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

function ValueEditor({
  value,
  onChange,
  label,
  readOnly
}: {
  value: ValueDraft
  onChange: (value: ValueDraft) => void
  label: string
  readOnly: boolean
}) {
  const t = useTranslation()
  const types: ValueType[] = ['string', 'number', 'boolean', 'null', 'object', 'array']
  return (
    <fieldset disabled={readOnly} style={{ border: 0, padding: 'var(--spacing-2)', minWidth: 0 }}>
      <legend>{label}</legend>
      <select
        aria-label={`${label} type`}
        value={value.type}
        onChange={(event) => {
          onChange(emptyValue(event.target.value as ValueType))
        }}
      >
        {types.map((type) => (
          <option key={type} value={type}>
            {t(`frontmatterEditor.types.${type}`, type)}
          </option>
        ))}
      </select>
      {value.type === 'string' && (
        <textarea
          className={styles.propertyEditorInput}
          aria-label={`${label} value`}
          value={value.text}
          onChange={(event) => {
            onChange({ ...value, text: event.target.value })
          }}
        />
      )}
      {value.type === 'number' && (
        <input
          className={styles.propertyEditorInput}
          aria-label={`${label} value`}
          value={value.text}
          onChange={(event) => {
            onChange({ ...value, text: event.target.value })
          }}
        />
      )}
      {value.type === 'boolean' && (
        <input
          type="checkbox"
          aria-label={`${label} value`}
          checked={value.text === 'true'}
          onChange={(event) => {
            onChange({ ...value, text: String(event.target.checked) })
          }}
        />
      )}
      {(value.type === 'object' || value.type === 'array') && (
        <>
          {value.entries.map((entry, index) => (
            <div key={index}>
              {value.type === 'object' && (
                <input
                  className={styles.propertyEditorInput}
                  aria-label={`${label} key ${index + 1}`}
                  value={entry.key}
                  onChange={(event) => {
                    onChange({
                      ...value,
                      entries: value.entries.map((item, i) => (i === index ? { ...item, key: event.target.value } : item))
                    })
                  }}
                />
              )}
              <ValueEditor
                value={entry.value}
                label={`${label}[${index + 1}]`}
                readOnly={readOnly}
                onChange={(child) => {
                  onChange({ ...value, entries: value.entries.map((item, i) => (i === index ? { ...item, value: child } : item)) })
                }}
              />
              <button
                type="button"
                aria-label={`${label} remove ${index + 1}`}
                className={styles.secondaryButton}
                onClick={() => {
                  onChange({ ...value, entries: value.entries.filter((_, i) => i !== index) })
                }}
              >
                {t('frontmatterEditor.removeEntry', 'Remove entry')}
              </button>
            </div>
          ))}
          <button
            type="button"
            className={classNames(styles.primaryButton, styles.smallButton)}
            onClick={() => {
              onChange({ ...value, entries: [...value.entries, { key: '', value: emptyValue('string') }] })
            }}
          >
            {t('frontmatterEditor.addEntry', 'Add entry')}
          </button>
        </>
      )}
    </fieldset>
  )
}
