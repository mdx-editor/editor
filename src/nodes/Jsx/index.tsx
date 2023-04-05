/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  $getRoot,
  createEditor,
  DecoratorNode,
  LexicalEditor,
  LexicalNode,
  NodeKey,
  ParagraphNode,
  SerializedEditorState,
  SerializedLexicalNode,
  SerializedParagraphNode,
  SerializedRootNode,
  Spread,
} from 'lexical'
import React from 'react'
import { MdxJsxAttribute } from 'mdast-util-mdx-jsx'
import { ReactComponent as SettingsIcon } from './icons/settings.svg'
// import { ReactComponent as ExtensionIcon } from './icons/extension.svg'
import * as styles from './styles.css'
import * as RadixPopover from '@radix-ui/react-popover'
import { PopoverContent, PopoverTrigger } from '../../ui/Popover/primitives'
import { LexicalNestedComposer } from '@lexical/react/LexicalNestedComposer'
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { contentTheme, useEmitterValues } from '../../'
import { useForm } from 'react-hook-form'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'

type JsxKind = 'text' | 'flow'

type updateFn = (node: LexicalNode) => void
export interface JsxPayload {
  name: string
  kind: JsxKind
  attributes: Array<MdxJsxAttribute>
  state?: SerializedEditorState
  updateFn?: updateFn
}

export type SerializedJsxNode = Spread<
  {
    name: string
    kind: JsxKind
    attributes: Array<MdxJsxAttribute>
    state?: SerializedEditorState
    type: 'jsx'
    version: 1
  },
  SerializedLexicalNode
>

interface JsxNodeConstructorParams {
  name: string
  kind: JsxKind
  attributes: Array<MdxJsxAttribute>
  state?: SerializedEditorState
  key?: NodeKey
  updateFn?: updateFn
}
const EmptySerializedTextEditorState = {
  type: 'root',
  format: 'left',
  indent: 0,
  direction: 'ltr',
  version: 1,
  children: [
    {
      type: 'paragraph',
      version: 1,
      direction: 'ltr',
      format: 'left',
      indent: 0,
      children: [],
    } as SerializedParagraphNode,
  ],
} as SerializedRootNode

const EmptySerializedFlowEditorState = {
  type: 'root',
  format: 'left',
  indent: 0,
  direction: 'ltr',
  version: 1,
  children: [],
} as SerializedRootNode

export class JsxNode extends DecoratorNode<JSX.Element> {
  __kind: JsxKind
  __name: string
  __attributes: Array<MdxJsxAttribute>
  __editor: LexicalEditor

  static getType(): string {
    return 'jsx'
  }

  static clone(node: JsxNode): JsxNode {
    return new JsxNode({
      name: node.__name,
      kind: node.__kind,
      attributes: node.__attributes,
      state: node.__editor.getEditorState().toJSON(),
    })
  }

  static importJSON(serializedNode: SerializedJsxNode): JsxNode {
    const { name, kind, attributes, state } = serializedNode
    return $createJsxNode({
      kind,
      name,
      attributes,
      state,
    })
  }

  constructor({ name, kind, attributes, state, updateFn, key }: JsxNodeConstructorParams) {
    super(key)
    if (!attributes) {
      debugger
    }
    this.__name = name
    this.__kind = kind
    this.__attributes = attributes
    this.__editor = createEditor()
    if (state) {
      const parsedState = this.__editor.parseEditorState(state)
      if (!parsedState.isEmpty()) {
        this.__editor.setEditorState(parsedState)
      }
    } else if (updateFn) {
      const parsedState = this.__editor.parseEditorState(
        { root: this.getKind() === 'text' ? EmptySerializedTextEditorState : EmptySerializedFlowEditorState },
        () => {
          if (this.getKind() === 'text') {
            const rootParagraph: ParagraphNode = $getRoot().getFirstChildOrThrow()
            updateFn(rootParagraph)
          } else {
            updateFn($getRoot())
          }
        }
      )
      if (!parsedState.isEmpty()) {
        this.__editor.setEditorState(parsedState)
      }
    }
  }

  exportJSON(): SerializedJsxNode {
    return {
      name: this.getName(),
      kind: this.getKind(),
      attributes: this.getAttributes(),
      state: this.__editor.getEditorState().toJSON(),
      type: 'jsx',
      version: 1,
    }
  }

  inNestedEditor(callback: () => void) {
    this.__editor.getEditorState().read(callback)
  }

  getChildren(): Array<LexicalNode> {
    if (this.getKey() === 'flow') {
      return $getRoot().getChildren() || []
    } else {
      const firstChild = $getRoot().getFirstChild()
      if (!firstChild) {
        return []
      }
      return (firstChild as ParagraphNode).getChildren() || []
    }
  }

  createDOM(): HTMLElement {
    if (this.getKey() === 'flow') {
      return document.createElement('div')
    } else {
      return document.createElement('span')
    }
  }

  updateDOM(): false {
    return false
  }

  getName() {
    return this.__name
  }

  getKind() {
    return this.__kind
  }

  getAttributes() {
    return this.__attributes
  }

  updateAttributes(attributeValues: Record<string, string>) {
    this.getWritable().__attributes = Object.entries(attributeValues).map(([name, value]) => {
      return { name, value } as MdxJsxAttribute
    })
  }

  decorate(): JSX.Element {
    if (this.getKind() === 'flow') {
      return (
        <div className={styles.blockComponent}>
          <div>{this.getName()}</div>
          <LexicalNestedComposer initialEditor={this.__editor} initialTheme={contentTheme}>
            <RichTextPlugin
              contentEditable={<ContentEditable style={{ padding: 5, border: '1px solid red' }} />}
              placeholder={<div>Type here..</div>}
              ErrorBoundary={LexicalErrorBoundary}
            />
          </LexicalNestedComposer>
        </div>
      )
    }
    return (
      <span className={styles.inlineComponent}>
        <span>
          <InlineJsxComponent
            attributes={this.getAttributes()}
            componentName={this.getName()}
            onSubmit={(attributeValues) => this.updateAttributes(attributeValues)}
          />
        </span>
        <span>
          {this.getName()}

          <LexicalNestedComposer initialEditor={this.__editor} initialTheme={contentTheme}>
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
    }, {} as Record<string, string>),
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

export function $createJsxNode(payload: JsxPayload): JsxNode {
  return new JsxNode(payload)
}

export function $isJsxNode(node: LexicalNode | null | undefined): node is JsxNode {
  return node instanceof JsxNode
}
