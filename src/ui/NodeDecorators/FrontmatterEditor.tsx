import YamlParser from 'js-yaml'
import React from 'react'
import { FrontmatterEditorProps } from '../../types/NodeDecoratorsProps'
import { useForm, useFieldArray } from 'react-hook-form'
import { ReactComponent as ArrowRight } from './icons/arrow_right.svg'
import { ReactComponent as ArrowDown } from './icons/arrow_drop_down.svg'
import { ReactComponent as DeleteIcon } from './icons/delete.svg'
import classNames from 'classnames'
import styles from '../styles.module.css'

type YamlConfig = Array<{ key: string; value: string }>

export const FrontmatterEditor = ({ yaml, onChange }: FrontmatterEditorProps) => {
  const [expanded, setExpanded] = React.useState(true)
  const yamlConfig = React.useMemo<YamlConfig>(() => {
    if (!yaml) {
      return []
    }
    return Object.entries(YamlParser.load(yaml) as Record<string, string>).map(([key, value]) => ({ key, value }))
  }, [yaml])

  const { register, control, watch } = useForm({
    defaultValues: {
      yamlConfig,
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'yamlConfig',
  })

  React.useEffect(() => {
    const subscription = watch(({ yamlConfig }) => {
      const yaml = (yamlConfig as YamlConfig).reduce((acc, { key, value }) => {
        if (key && value) {
          acc[key] = value
        }
        return acc
      }, {} as Record<string, string>)
      onChange(YamlParser.dump(yaml).trim())
    })

    return () => subscription.unsubscribe()
  }, [watch, onChange])

  return (
    <div className={styles.frontmatterWrapper} data-expanded={expanded}>
      <button
        className={styles.frontmatterToggleButton}
        onClick={(e) => {
          e.preventDefault()
          setExpanded((v) => !v)
        }}
      >
        {expanded ? <ArrowDown /> : <ArrowRight />}
        Document frontmatter
      </button>

      {expanded && (
        <form>
          <table className={styles.frontmatterEditorTable}>
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
                      <TableInput {...register(`yamlConfig.${index}.key`, { required: true })} autofocusIfEmpty />
                    </td>
                    <td>
                      <TableInput {...register(`yamlConfig.${index}.value`, { required: true })} />
                    </td>
                    <td>
                      <button type="button" onClick={() => remove(index)} className={styles.iconButton}>
                        <DeleteIcon />
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
                    className={styles.primaryButton}
                    type="button"
                    onClick={() => {
                      append({ key: '', value: '' })
                    }}
                  >
                    Add new key
                  </button>
                </td>
              </tr>
            </tfoot>
          </table>
        </form>
      )}
    </div>
  )
}

const TableInput = React.forwardRef<
  HTMLInputElement,
  React.HTMLAttributes<HTMLInputElement> & { autofocusIfEmpty?: boolean; autoFocus?: boolean; value?: string }
>(({ className, autofocusIfEmpty, ...props }, ref) => {
  props.autoFocus = Boolean(!props.value && autofocusIfEmpty)
  return <input className={styles.frontmatterInput} {...props} ref={ref} />
})
