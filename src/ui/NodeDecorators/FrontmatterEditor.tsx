import YamlParser from 'js-yaml'
import React from 'react'
import { FrontmatterEditorProps } from '../../types/NodeDecoratorsProps'
import { useForm, useFieldArray } from 'react-hook-form'

type YamlConfig = Array<{ key: string; value: string }>

export const FrontmatterEditor = ({ yaml, onChange }: FrontmatterEditorProps) => {
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
    <form>
      <ul>
        {fields.map((item, index) => {
          return (
            <li key={item.id}>
              <input {...register(`yamlConfig.${index}.key`, { required: true })} />{' '}
              <input {...register(`yamlConfig.${index}.value`, { required: true })} />
              <button type="button" onClick={() => remove(index)}>
                Delete
              </button>
            </li>
          )
        })}
      </ul>
      <section>
        <button
          type="button"
          onClick={() => {
            append({ key: '', value: '' })
          }}
        >
          append
        </button>
      </section>
    </form>
  )
}
