import YamlParser from 'js-yaml'
import React from 'react'
import { FrontmatterEditorProps } from '../../types/NodeDecoratorsProps'
import { useForm, useFieldArray } from 'react-hook-form'
import { ReactComponent as ArrowRight } from './icons/arrow_right.svg'
import { ReactComponent as ArrowDown } from './icons/arrow_drop_down.svg'
import { ReactComponent as DeleteIcon } from './icons/delete.svg'
import classNames from 'classnames'

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
    <div className="border-2 border-solid rounded-md border-primary-50 p-3 not-prose data-[expanded=true]:mb-10" data-expanded={expanded}>
      <button
        className="border-0 bg-transparent  flex items-center text-sm"
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
          <table className="table-fixed border-spacing-x-1 border-spacing-y-3 border-separate">
            <colgroup>
              <col className="w-[30%]" />
              <col className="w-[70%]" />
              <col className="w-12" />
            </colgroup>
            <thead className="text-xs">
              <tr>
                <th className="text-left">Key</th>
                <th className="text-left">Value</th>
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
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="bg-transparent border-0 text-primary-400 hover:text-primary-600"
                      >
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
                    className="rounded-md py-2 px-3 bg-primary-100 active:bg-primary-200 text-sm"
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
  return <input className={classNames('w-full bg-primary-50 px-2 py-1 rounded-md font-mono', className)} {...props} ref={ref} />
})
