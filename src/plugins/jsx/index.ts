import { mdxFromMarkdown, mdxToMarkdown } from 'mdast-util-mdx'
import type { MdxJsxFlowElement, MdxJsxTextElement } from 'mdast-util-mdx-jsx'
import { mdxjs } from 'micromark-extension-mdxjs'
import React from 'react'
import {
  addExportVisitor$,
  addImportVisitor$,
  addLexicalNode$,
  addMdastExtension$,
  addSyntaxExtension$,
  addToMarkdownExtension$,
  insertDecoratorNode$,
  jsxComponentDescriptors$,
  jsxIsAvailable$
} from '../core'
import { $createLexicalJsxNode, LexicalJsxNode } from './LexicalJsxNode'
import { LexicalJsxVisitor } from './LexicalJsxVisitor'
import { MdastMdxJsEsmVisitor } from './MdastMdxJsEsmVisitor'
import { MdastMdxJsxElementVisitor } from './MdastMdxJsxElementVisitor'
import * as Mdast from 'mdast'
import { Signal, map } from '@mdxeditor/gurx'
import { realmPlugin } from '../../RealmWithPlugins'

/**
 * An MDX JSX MDAST node.
 * @group JSX
 */
export type MdastJsx = MdxJsxTextElement | MdxJsxFlowElement

/**
 * Defines the structure of a JSX component property.
 * @group JSX
 */
export interface JsxPropertyDescriptor {
  /**
   * The name of the property
   */
  name: string
  /**
   * The type of the property
   */
  type: 'string' | 'number'
  /**
   * Wether the property is required
   */
  required?: boolean
}

/**
 * Defines the structure of a JSX component that can be used within the markdown document.
 * @group JSX
 */
export interface JsxComponentDescriptor {
  /**
   * The tag name
   */
  name: string
  /**
   * Wether the component is a flow or text component (inline or block)
   */
  kind: 'flow' | 'text'
  /**
   * The module path from which the component can be imported
   * Omit to skip injecting an import statement
   */
  source?: string
  /**
   * Wether the component is the default export of the module
   */
  defaultExport?: boolean
  /**
   * The properties that can be applied to the component
   */
  props: JsxPropertyDescriptor[]
  /**
   * Wether or not the component has children
   */
  hasChildren?: boolean

  /**
   * The editor to use for editing the component
   */
  Editor: React.ComponentType<JsxEditorProps>
}

/**
 * The properties passed to a custom JSX Editor component.
 * @group JSX
 */
export interface JsxEditorProps {
  /** The MDAST node to edit */
  mdastNode: MdastJsx
  /** The descriptor that activated the editor */
  descriptor: JsxComponentDescriptor
}

/**
 * Determines wether the given node is a JSX node.
 * @group JSX
 */
export function isMdastJsxNode(node: Mdast.Nodes): node is MdastJsx {
  return node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement'
}

function toMdastJsxAttributes(attributes: Record<string, string>): MdastJsx['attributes'] {
  return Object.entries(attributes).map(([name, value]) => ({
    type: 'mdxJsxAttribute',
    name,
    value
  }))
}

/**
 * A signal that inserts a new JSX node with the published payload.
 * @group JSX
 */
export const insertJsx$ = Signal<
  | {
      kind: 'text'
      name: string
      props: Record<string, string>
      children?: MdxJsxTextElement['children']
    }
  | {
      kind: 'flow'
      name: string
      props: Record<string, string>
      children?: MdxJsxFlowElement['children']
    }
>((r) => {
  r.link(
    r.pipe(
      insertJsx$,
      map(({ kind, name, children, props }) => {
        return () => {
          const attributes = toMdastJsxAttributes(props)

          if (kind === 'flow') {
            return $createLexicalJsxNode({
              type: 'mdxJsxFlowElement',
              name,
              children: children ?? [],
              attributes
            })
          } else {
            return $createLexicalJsxNode({
              type: 'mdxJsxTextElement',
              name,
              children: children ?? [],
              attributes
            })
          }
        }
      })
    ),
    insertDecoratorNode$
  )
})

/**
 * a plugin that adds support for JSX elements (MDX).
 * @group JSX
 */
export const jsxPlugin = realmPlugin<{
  /**
   * A set of descriptors that document the JSX elements used in the document.
   */
  jsxComponentDescriptors: JsxComponentDescriptor[]
}>({
  init: (realm, params) => {
    realm.pubIn({
      // import
      [jsxIsAvailable$]: true,
      [addMdastExtension$]: mdxFromMarkdown(),
      [addSyntaxExtension$]: mdxjs(),
      [addImportVisitor$]: [MdastMdxJsxElementVisitor, MdastMdxJsEsmVisitor],

      // export
      [addLexicalNode$]: LexicalJsxNode,
      [addExportVisitor$]: LexicalJsxVisitor,
      [addToMarkdownExtension$]: mdxToMarkdown(),
      [jsxComponentDescriptors$]: params?.jsxComponentDescriptors || []
    })
  },

  update(realm, params) {
    realm.pub(jsxComponentDescriptors$, params?.jsxComponentDescriptors || [])
  }
})
