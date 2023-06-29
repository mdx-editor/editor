/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { MdxJsxAttribute } from 'mdast-util-mdx-jsx'
import React from 'react'
import SettingsIcon from './icons/settings.svg'
// import ExtensionIcon from './icons/extension.svg'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary'
import { LexicalNestedComposer } from '@lexical/react/LexicalNestedComposer'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import * as RadixPopover from '@radix-ui/react-popover'
import { useForm } from 'react-hook-form'
import { useEmitterValues } from '../../system/EditorSystemComponent'
import { JsxEditorProps } from '../../types/NodeDecoratorsProps'
import { PopoverContent, PopoverTrigger } from '../../ui/Popover/primitives'

export function JsxEditor({ kind, attributes, componentName, editor, onSubmit, theme }: JsxEditorProps) {
  if (kind === 'flow') {
    return (
      <div>
        <div>{componentName}</div>
        <LexicalNestedComposer initialEditor={editor} initialTheme={theme}>
          <RichTextPlugin contentEditable={<ContentEditable />} placeholder={<div>Type here..</div>} ErrorBoundary={LexicalErrorBoundary} />
        </LexicalNestedComposer>
      </div>
    )
  }
  return (
    <span>
      <span>
        <InlineJsxComponent attributes={attributes} componentName={componentName} onSubmit={onSubmit} />
      </span>
      <span>
        {componentName}
        <LexicalNestedComposer initialEditor={editor} initialTheme={theme}>
          <RichTextPlugin
            contentEditable={<ContentEditable style={{ padding: 5, border: '1px solid red' }} />}
            placeholder={<div>Type here..</div>}
            ErrorBoundary={LexicalErrorBoundary}
          />
        </LexicalNestedComposer>
      </span>
    </span>
  )
}

interface InlineJsxComponentProps {
  attributes: MdxJsxAttribute[]
  componentName: string
  onSubmit: (values: Record<string, string>) => void
}

const InlineJsxComponent = ({ attributes, componentName, onSubmit }: InlineJsxComponentProps) => {
  const [open, setOpen] = React.useState(false)

  const decoratedOnSubmit = React.useCallback(
    (values: Record<string, string>) => {
      onSubmit(values)
      setOpen(false)
    },
    [onSubmit]
  )

  return (
    <RadixPopover.Root open={open} onOpenChange={(v) => setOpen(v)}>
      <PopoverTrigger>
        <SettingsIcon />
      </PopoverTrigger>
      <RadixPopover.Portal>
        <PopoverContent>
          <JsxPropertyPanel attributes={attributes} componentName={componentName} onSubmit={decoratedOnSubmit} />
        </PopoverContent>
      </RadixPopover.Portal>
    </RadixPopover.Root>
  )
}

interface JsxPropertyPanelProps {
  componentName: string
  attributes: Array<MdxJsxAttribute>
  onSubmit: (values: Record<string, string>) => void
}

const JsxPropertyPanel: React.FC<JsxPropertyPanelProps> = ({ attributes, componentName, onSubmit }) => {
  const [jsxComponentDescriptors] = useEmitterValues('jsxComponentDescriptors')
  const descriptor = jsxComponentDescriptors.find((descriptor) => descriptor.name === componentName)!
  const [editor] = useLexicalComposerContext()

  const { register, handleSubmit } = useForm({
    defaultValues: attributes.reduce((acc, attribute) => {
      // TODO: handle mdxjs expressions
      acc[attribute.name] = attribute.value as string
      return acc
    }, {} as Record<string, string>)
  })

  // iterate over the attributes and render a two column table with the name and value
  return (
    <form
      onSubmit={handleSubmit((data) => {
        editor.update(() => {
          onSubmit(data)
        })
      })}
    >
      <table>
        <thead>
          <tr>
            <th>Attribute</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          {descriptor.props.map((propDescriptor) => (
            <tr key={propDescriptor.name}>
              <td> {propDescriptor.name} </td>
              <td>
                <input {...register(propDescriptor.name)} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button type="submit">Submit</button>
    </form>
  )
}
