import { $getRoot, DecoratorNode, EditorConfig, LexicalEditor, LexicalNode, NodeKey, SerializedLexicalNode, Spread } from 'lexical'
import React from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import classNames from 'classnames'
import YamlParser from 'js-yaml'
import { useFieldArray, useForm } from 'react-hook-form'

import styles from '../../styles/ui.module.css'
import { editorRootElementRef$, iconComponentFor$, readOnly$, useTranslation } from '../core'
import { Cell, useCellValues, usePublisher } from '@mdxeditor/gurx'
import { rootEditor$ } from '../core'
import { Action, withLatestFrom } from '@mdxeditor/gurx'

/**
 * A serialized representation of an {@link FrontmatterNode}.
 */
export type SerializedFrontmatterNode = Spread<
  {
    yaml: string
    version: 1
  },
  SerializedLexicalNode
>

type YamlConfig = { key: string; value: string }[]

export interface FrontmatterEditorProps {
  yaml: string
  onChange: (yaml: string) => void
}

/**
 * Whether the frontmatter dialog is open.
 * @group Frontmatter
 */
export const frontmatterDialogOpen$ = Cell(false)

/**
 * Removes the frontmatter node from the markdown document.
 * @group Frontmatter
 */
export const removeFrontmatter$ = Action((r) => {
  r.sub(r.pipe(removeFrontmatter$, withLatestFrom(rootEditor$)), ([, rootEditor]) => {
    rootEditor?.update(() => {
      const firstItem = $getRoot().getFirstChild()
      if ($isFrontmatterNode(firstItem)) {
        firstItem.remove()
      }
    })
    r.pub(frontmatterDialogOpen$, false)
  })
})

/**
 * Represents {@link https://daily-dev-tips.com/posts/what-exactly-is-frontmatter/ | the frontmatter} of the markdown document.
 * Use {@link "$createFrontmatterNode"} to construct one.
 */
export class FrontmatterNode extends DecoratorNode<JSX.Element> {
  __yaml: string

  static getType(): string {
    return 'frontmatter'
  }

  static clone(node: FrontmatterNode): FrontmatterNode {
    return new FrontmatterNode(node.__yaml, node.__key)
  }

  static importJSON(serializedNode: SerializedFrontmatterNode): FrontmatterNode {
    const { yaml } = serializedNode
    const node = $createFrontmatterNode(yaml)
    return node
  }

  constructor(code: string, key?: NodeKey) {
    super(key)
    this.__yaml = code
  }

  exportJSON(): SerializedFrontmatterNode {
    return {
      yaml: this.getYaml(),
      type: 'frontmatter',
      version: 1
    }
  }

  // View
  createDOM(_config: EditorConfig): HTMLDivElement {
    return document.createElement('div')
  }

  updateDOM(): false {
    return false
  }

  getYaml(): string {
    return this.getLatest().__yaml
  }

  setYaml(yaml: string) {
    if (yaml !== this.__yaml) {
      this.getWritable().__yaml = yaml
    }
  }

  decorate(editor: LexicalEditor): JSX.Element {
    return (
      <FrontmatterEditor
        yaml={this.getYaml()}
        onChange={(yaml) => {
          editor.update(() => {
            this.setYaml(yaml)
          })
        }}
      />
    )
  }
}

/**
 * Creates a {@link FrontmatterNode}.
 * @param yaml - The YAML string of the frontmatter.
 */
export function $createFrontmatterNode(yaml: string): FrontmatterNode {
  return new FrontmatterNode(yaml)
}

/**
 * Returns `true` if the given node is a {@link FrontmatterNode}.
 */
export function $isFrontmatterNode(node: LexicalNode | null | undefined): node is FrontmatterNode {
  return node instanceof FrontmatterNode
}

export const FrontmatterEditor = ({ yaml, onChange }: FrontmatterEditorProps) => {
  const [readOnly, editorRootElementRef, iconComponentFor, frontmatterDialogOpen] = useCellValues(
    readOnly$,
    editorRootElementRef$,
    iconComponentFor$,
    frontmatterDialogOpen$
  )
  const t = useTranslation()
  const setFrontmatterDialogOpen = usePublisher(frontmatterDialogOpen$)
  const removeFrontmatter = usePublisher(removeFrontmatter$)
  const yamlConfig = React.useMemo<YamlConfig>(() => {
    if (!yaml) {
      return []
    }
    return Object.entries(YamlParser.load(yaml) as Record<string, string>).map(([key, value]) => ({ key, value }))
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

  const onSubmit = React.useCallback(
    ({ yamlConfig }: { yamlConfig: YamlConfig }) => {
      if (yamlConfig.length === 0) {
        removeFrontmatter()
        setFrontmatterDialogOpen(false)
        return
      }
      const yaml = yamlConfig.reduce<Record<string, string>>((acc, { key, value }) => {
        if (key && value) {
          acc[key] = value
        }
        return acc
      }, {})
      onChange(YamlParser.dump(yaml).trim())
      setFrontmatterDialogOpen(false)
    },
    [onChange, setFrontmatterDialogOpen, removeFrontmatter]
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
                    <th>{t('frontmatterEditor.key', 'Key')}</th>
                    <th>{t('frontmatterEditor.value', 'Value')}</th>
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
                        disabled={readOnly}
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
                <button type="submit" className={styles.primaryButton}>
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
